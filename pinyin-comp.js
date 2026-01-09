#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
const { match } = require('pinyin-pro');

const [,, baseDir, originalTyped] = process.argv;
if (!originalTyped) process.exit(-1);

try {
  let effectiveDir = baseDir, displayPrefix = '', typed = originalTyped;

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

  const files = fs.readdirSync(targetDir);
  
  const result = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (/^[a-z0-9]+$/i.test(f)) continue;
    const m = match(f, pattern, { continuous: true, precision: 'start' });
    if (m && m[0] === 0) result.push(f);
  }

  if (result.length) {
    const prefix = displayPrefix + (pathPart ? pathPart + '/' : '');
    process.stdout.write(result.map(f => prefix + f).join('\n'));
  }
} catch {
  process.exit(-1);
}