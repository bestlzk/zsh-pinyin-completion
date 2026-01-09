function _pinyin_comp()
{
    local cwd=${PWD:A}
    reply=(${(f)"$(~/.zsh/zsh-pinyin-completion/pinyin-comp.js "$cwd" "$@")"})
}

zstyle ':completion:*' user-expand _pinyin_comp
zstyle ':completion:*:user-expand:*' tag-order expansions
zstyle ':completion:*' completer _oldlist _expand _complete _match _user_expand
