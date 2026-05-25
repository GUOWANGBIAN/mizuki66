# Mizuki

一个基于 [Astro](https://astro.build) 构建的现代化静态博客模板，具有丰富的功能和精美的设计。

![Node.js >= 20](https://img.shields.io/badge/node.js-%3E%3D20-brightgreen)
![pnpm >= 9](https://img.shields.io/badge/pnpm-%3E%3D9-blue)
![Astro](https://img.shields.io/badge/Astro-5.15.3-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

![Mizuki Preview](./README.webp)

**[在线预览](https://mizuki.mysqil.com/)** · **[文档](https://docs.mizuki.mysqil.com/)** · **[English](./README.md)** · **[中文](./README.zh.md)** · **[日本語](./docs/README.ja.md)** · **[繁體中文](./docs/README.tw.md)**

## 预览

<table>
  <tr>
    <td><img alt="" src="docs/image/1.webp"></td>
    <td><img alt="" src="docs/image/2.webp"></td>
    <td><img alt="" src="docs/image/3.webp"></td>
  </tr>
  <tr>
    <td><img alt="" src="docs/image/4.webp"></td>
    <td><img alt="" src="docs/image/5.webp"></td>
    <td><img alt="" src="docs/image/6.webp"></td>
  </tr>
</table>

## 特性

### 设计与界面
- 基于 [Astro](https://astro.build) 和 [Tailwind CSS](https://tailwindcss.com) 构建
- 使用 [Swup](https://swup.js.org/) 实现流畅的页面过渡动画
- 亮色/暗色主题切换，支持系统偏好检测
- 可自定义主题颜色和动态横幅轮播
- 全屏背景图片支持轮播、透明度和模糊效果
- 完全响应式设计，适配所有设备

### 内容与搜索
- 基于 [Pagefind](https://pagefind.app/) 的高级搜索功能
- 增强的 Markdown 功能，支持语法高亮
- 交互式目录，支持自动滚动
- RSS 订阅源生成
- 阅读时间估算
- 文章分类和标签系统

### 特色页面
- **动漫追踪页面** - 追踪动漫观看进度和评分
- **友链页面** - 精美的友链卡片展示
- **日记页面** - 分享生活瞬间
- **归档页面** - 时间线视图的文章归档
- **关于页面** - 可自定义的个人介绍

### 技术特性
- 基于 [Expressive Code](https://expressive-code.com/) 的增强代码块
- KaTeX 数学公式渲染
- PhotoSwipe 图片画廊集成
- SEO 优化，包括站点地图和 meta 标签
- 懒加载和缓存的性能优化
- Twikoo 评论系统集成

## 快速开始

### 安装

```bash
# 克隆仓库
git clone https://github.com/matsuzaka-yuki/mizuki.git
cd mizuki

# 安装 pnpm（如果未安装）
npm install -g pnpm

# 安装依赖
pnpm install
```

### 配置

编辑 `src/config.ts` 自定义博客设置：
- 站点信息、主题颜色、横幅图片
- 社交链接、侧边栏配置
- 功能页面开关

### 开发

```bash
pnpm dev
```

访问 `http://localhost:4321` 查看效果。

### 部署

部署到任意静态托管平台：
- **Vercel:** 连接 GitHub 仓库
- **Netlify:** 从 GitHub 直接部署
- **GitHub Pages:** 使用内置的 GitHub Actions 工作流
- **Cloudflare Pages:** 连接仓库

部署前请更新 `src/config.ts` 中的 `siteURL`。

## 内容管理

### 创建文章

```bash
pnpm new-post <filename>
```

### 文章格式

```yaml
---
title: 文章标题
published: 2024-01-01
description: 文章描述
image: ./cover.jpg
tags: [标签1, 标签2]
category: 分类
draft: false
pinned: false
lang: zh  # 仅当文章语言与站点语言不同时设置
---
```

### 字段说明

- **title:** 文章标题（必填）
- **published:** 发布日期（必填）
- **description:** 文章描述，用于 SEO 和预览
- **image:** 封面图片路径（相对于文章文件）
- **tags:** 标签数组
- **category:** 文章分类
- **draft:** 设为 `true` 可在生产环境隐藏文章
- **pinned:** 设为 `true` 可置顶文章
- **lang:** 文章语言（仅当与站点默认语言不同时设置）

## Markdown 扩展

### 增强写作
- **提示框:** 使用 `> [!NOTE]`、`> [!TIP]`、`> [!WARNING]` 等创建提示框
- **数学公式:** 使用 `$行内$` 和 `$$块级$$` 语法编写 LaTeX 公式
- **代码高亮:** 高级语法高亮，支持行号和复制按钮
- **GitHub 卡片:** 使用 `::github{repo="user/repo"}` 嵌入仓库卡片

### 可视元素
- **图片画廊:** 自动集成 PhotoSwipe 查看图片
- **可折叠区块:** 创建可展开的内容块

### 内容组织
- **目录:** 从标题自动生成，支持平滑滚动
- **阅读时间:** 自动计算并显示

## 命令

| 命令 | 说明 |
|:-----|:-----|
| `pnpm install` | 安装依赖 |
| `pnpm dev` | 启动本地开发服务器 |
| `pnpm build` | 构建生产站点 |
| `pnpm preview` | 预览构建结果 |
| `pnpm check` | 运行 Astro 错误检查 |
| `pnpm format` | 使用 Prettier 格式化代码 |
| `pnpm lint` | 检查并修复代码问题 |
| `pnpm new-post <filename>` | 创建新文章 |

## 环境变量（可选）

在 `.env` 文件或部署平台中配置：

```bash
# Umami API 密钥
UMAMI_API_KEY=your_umami_api_key_here

# bcrypt 加密轮数（推荐 10-14，默认 12）
BCRYPT_SALT_ROUNDS=12
```

> **注意:** 不建议将 `.env` 文件提交到 Git。云平台部署建议通过平台的环境变量配置。

## 许可证

本项目基于 Apache License 2.0 许可证 - 详见 [LICENSE](LICENSE) 文件。

### 原始项目许可证

本项目基于 [Fuwari](https://github.com/saicaca/fuwari)，使用 MIT 许可证。

## 致谢

- 基于 [Fuwari](https://github.com/saicaca/fuwari) 模板
- 灵感来自 [Yukina](https://github.com/WhitePaper233/yukina) 博客模板
- 部分设计灵感来自 [Firefly](https://github.com/CuteLeaf/Firefly) 模板
- 使用 [Pio](https://github.com/Dreamer-Paul/Pio) 实现 Live2D 看板娘
- 使用 [Astro](https://astro.build) 和 [Tailwind CSS](https://tailwindcss.com) 构建
- 图标来自 [Iconify](https://iconify.design/)

## 贡献者

感谢所有对本项目做出贡献的人。如有问题或建议，请提交 [Issue](https://github.com/matsuzaka-yuki/Mizuki/issues) 或 [Pull Request](https://github.com/matsuzaka-yuki/Mizuki/pulls)。

<a href="https://github.com/matsuzaka-yuki/Mizuki/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=matsuzaka-yuki/Mizuki" />
</a>

## Star 历史

[![Star History Chart](https://api.star-history.com/svg?repos=matsuzaka-yuki/Mizuki&type=Date)](https://star-history.com/#matsuzaka-yuki/Mizuki&Date)

---

如果这个项目对你有帮助，请考虑给它一个 Star！
