# zsh-pinyin-completion

![License](https://img.shields.io/badge/license-MIT-blue.svg)

使用拼音匹配中文文件/目录的 Zsh 补全插件。

## 功能特性 (Features)

*   **路径补全**：支持对中文目录和文件路径进行自动补全。
*   **拼音匹配**：支持全拼（如 `xiazai` -> `下载`）。
*   **首字母匹配**：支持拼音首字母缩写（如 `xz` -> `下载`）。

## 前置要求 (Requirements)

*   **Node.js**: 本插件依赖 Node.js 运行，请确保您的环境中已安装。

## 安装 (Installation)

```zsh
git clone --depth=1 https://github.com/bestlzk/zsh-pinyin-completion ~/.zsh/zsh-pinyin-completion
cd ~/.zsh/zsh-pinyin-completion && npm install
echo "source ~/.zsh/zsh-pinyin-completion/zsh-pinyin-completion.zsh" >> ~/.zshrc
```

## 使用 (Usage)
- 在终端输入路径或文件名时，可用中文的全拼或首字母进行补全。
- 示例：`~/下载` 可通过输入 `~/xiazai` 或 `~/xz` 触发补全。

## 许可证 (License)

本项目基于 [MIT License](./LICENSE) 开源。

### 依赖说明 (Dependencies)

本项目使用了以下优秀的开源组件：
* [pinyin-pro](https://github.com/zh-lx/pinyin-pro)