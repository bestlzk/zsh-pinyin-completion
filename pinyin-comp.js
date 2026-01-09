#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
const net = require('net');
const { match } = require('pinyin-pro');

/**
 * 核心补全逻辑
 * @param {string} baseDir 当前工作目录
 * @param {string} originalTyped 用户输入的原始字符串
 * @returns {string[]} 匹配的文件路径列表
 */
function getCompletions(baseDir, originalTyped) {
  try {
    let effectiveDir = baseDir, displayPrefix = '', typed = originalTyped;

    // 路径预处理：
    // 1. 处理 ~ 和 / 开头的路径
    // 2. 分离目录路径和文件名匹配模式
    if (typed.startsWith('~')) {
      effectiveDir = os.homedir();
      displayPrefix = typed.startsWith('~/') ? '~/' : '~';
      typed = typed.slice(displayPrefix.length);
    } else if (typed.startsWith('/')) {
      effectiveDir = '/';
      displayPrefix = '/';
      typed = typed.slice(1);
    }

    const lastSlash = typed.lastIndexOf('/');
    const pathPart = lastSlash !== -1 ? typed.slice(0, lastSlash) : '';
    const pattern = lastSlash !== -1 ? typed.slice(lastSlash + 1) : typed;

    const targetDir = path.join(effectiveDir, pathPart);
    if (!fs.existsSync(targetDir)) return [];

    // 遍历文件进行匹配：
    // 1. 跳过纯英文/数字/符号文件名（交由 Zsh 默认处理）
    // 2. 使用 pinyin-pro 进行中文拼音首字母匹配
    const files = fs.readdirSync(targetDir);
    const result = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (/^[a-z0-9._-]+$/i.test(f)) continue;
      const m = match(f, pattern, { continuous: true, precision: 'start' });
      if (m && m[0] === 0) result.push(f);
    }

    if (result.length) {
      const prefix = displayPrefix + (pathPart ? pathPart + '/' : '');
      return result.map(f => prefix + f);
    }
    return [];
  } catch (e) {
    return [];
  }
}

const args = process.argv.slice(2);

// 服务器模式 (Server Mode)
if (args[0] === '--server') {
  const socketPath = args[1];
  if (!socketPath) {
    console.error('需要提供 Socket 路径参数');
    process.exit(1);
  }

  // 启动前尝试清理可能残留的 Socket 文件
  if (fs.existsSync(socketPath)) {
    try { fs.unlinkSync(socketPath); } catch (e) {}
  }

  // 资源管理：设置 20 分钟无请求自动退出的定时器
  let idleTimer = null;
  const IDLE_TIMEOUT = 20 * 60 * 1000;
  const resetIdleTimer = () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      server.close();
      process.exit(0);
    }, IDLE_TIMEOUT);
  };

  const server = net.createServer((socket) => {
    resetIdleTimer();
    
    // 处理连接请求：
    // 1. 解析协议（cwd + \0 + typed）
    // 2. 调用核心补全逻辑
    // 3. 返回结果并关闭连接
    socket.on('data', (data) => {
      const msg = data.toString();
      const splitIdx = msg.indexOf('\0');
      if (splitIdx !== -1) {
        const cwd = msg.slice(0, splitIdx);
        const typed = msg.slice(splitIdx + 1);
        try {
          const results = getCompletions(cwd, typed);
          if (results.length > 0) {
            socket.write(results.join('\n'));
          }
        } catch (e) {}
      }
      socket.end();
    });
  });

  server.listen(socketPath, () => {
    resetIdleTimer();
  });

  // 进程清理：退出时删除 Socket 文件
  const cleanup = () => {
    if (fs.existsSync(socketPath)) fs.unlinkSync(socketPath);
  };
  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(); });
  process.on('SIGTERM', () => { cleanup(); process.exit(); });

} else {
  // 命令行模式 (CLI Mode) - 作为回退方案
  const [baseDir, originalTyped] = args;
  if (baseDir && originalTyped) {
    const results = getCompletions(baseDir, originalTyped);
    if (results.length) process.stdout.write(results.join('\n'));
  }
}
