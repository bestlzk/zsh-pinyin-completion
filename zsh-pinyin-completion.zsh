# 初始化配置：加载 socket 模块，定义 Socket 路径和脚本位置
zmodload zsh/net/socket 2>/dev/null
_PINYIN_SOCKET_PATH="/tmp/zsh-pinyin-completion-${UID}.sock"
_PINYIN_SCRIPT_PATH="${0:A:h}/pinyin-comp.js"

# 后台启动 Node.js 服务
function _pinyin_start_server() {
    nohup node "$_PINYIN_SCRIPT_PATH" --server "$_PINYIN_SOCKET_PATH" >/dev/null 2>&1 &!
}

# 核心补全函数
function _pinyin_comp()
{
    local cwd=${PWD:A}
    local query="$@"
    
    # 检查环境：如果没有 socket 模块，降级为 CLI 模式
    if ! zmodload -e zsh/net/socket; then
        export PINYIN_COMP_MODE="CLI_FALLBACK_NO_MODULE"
        reply=(${(f)"$(node "$_PINYIN_SCRIPT_PATH" "$cwd" "$query")"})
        return
    fi

    # 尝试建立连接：
    # 1. 尝试直接连接
    # 2. 失败则清理旧 Socket 并启动新服务
    # 3. 等待服务启动后重试
    # 4. 再次失败则降级为 CLI 模式
    if ! zsocket "$_PINYIN_SOCKET_PATH" 2>/dev/null; then
        rm -f "$_PINYIN_SOCKET_PATH"
        _pinyin_start_server
        
        local i=0
        while [[ $i -lt 10 ]]; do
            if zsocket "$_PINYIN_SOCKET_PATH" 2>/dev/null; then
                break
            fi
            sleep 0.02
            ((i++))
        done
        if [[ $i -ge 10 ]]; then
            export PINYIN_COMP_MODE="CLI_FALLBACK_CONN_FAIL"
            reply=(${(f)"$(node "$_PINYIN_SCRIPT_PATH" "$cwd" "$query")"})
            return
        fi
    fi
    
    # zsocket 成功连接后，会将文件描述符自动存储在 REPLY 变量中    
    # 通信交互：发送请求并读取响应
    # 协议格式：当前目录 + \0 + 查询字符串
    export PINYIN_COMP_MODE="SERVER"
    print -u $REPLY -n "${cwd}\0${query}"
    local content=""
    while IFS= read -r -u $REPLY line || [[ -n "$line" ]]; do
        content+="$line"$'\n'
    done
    exec {REPLY}>&-
    reply=(${(f)content})
}

# 注册 Zsh 补全钩子
zstyle ':completion:*' user-expand _pinyin_comp
zstyle ':completion:*:user-expand:*' tag-order expansions
zstyle ':completion:*' completer _oldlist _expand _complete _match _user_expand
