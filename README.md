# 网页内容检查插件

一个基于Chrome扩展的网页内容检查工具，可以帮助用户检查网页中是否包含特定内容，并提供实时提醒功能。

## 功能特点

- 🔍 实时内容检查：支持对当前浏览的网页进行内容检查
- 📝 自定义规则：允许用户输入自定义的检查规则
- 🚨 即时提醒：发现违规内容时会显示醒目的提示
- 👀 侧边栏界面：采用Chrome侧边栏设计，操作便捷
- 🎯 精准定位：可以快速识别页面中的违规内容

## 安装说明

1. 下载本项目代码
2. 打开Chrome浏览器，进入扩展管理页面（chrome://extensions/）
3. 开启右上角的「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择本项目的文件夹

## 使用方法

1. 点击Chrome工具栏中的扩展图标，打开侧边栏
2. 在文本框中输入需要检查的内容规则
3. 点击「检查内容」按钮
4. 如果页面中包含违规内容，将会显示提醒通知

## 技术实现

- 基于Chrome Extension Manifest V3
- 使用原生JavaScript开发
- 采用Chrome Side Panel API实现侧边栏功能
- 使用Content Script实现页面内容检查
- 通过Background Service Worker处理扩展事件

## 项目结构

```
├── manifest.json      # 扩展配置文件
├── background.js      # 后台服务工作进程
├── content.js        # 内容脚本
├── sidepanel.html    # 侧边栏HTML
├── sidepanel.js      # 侧边栏逻辑
└── images/           # 图标资源
```

## 开发环境

- Chrome浏览器（建议使用最新版本）
- 支持ES6+的JavaScript环境
- 文本编辑器（如VS Code）

## 注意事项

- 确保Chrome浏览器已更新至支持Manifest V3的版本
- 开发模式下需要启用开发者模式
- 修改代码后需要在扩展管理页面点击刷新按钮

## 贡献指南

欢迎提交Issue和Pull Request来帮助改进这个项目。在提交代码前，请确保：

1. 代码符合项目的编码规范
2. 新功能有充分的测试
3. 提交信息清晰明确

## 许可证

本项目采用MIT许可证。详见LICENSE文件。