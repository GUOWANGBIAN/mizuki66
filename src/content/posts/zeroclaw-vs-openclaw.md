---
title: 从 OpenClaw 到 ZeroClaw：一次为了稳定与轻量的迁移实践
published: 2026-02-18
description: '本文仅为个人技术迁移体验分享，侧重部署流程、资源表现、使用感受，不涉及项目优劣评判，不引战、不捧一踩一，只为给同样在低配机器上折腾 AI Agent 的朋友提供一份可落地的参考'
image: ''
tags: [服务器运维]
category: 'Agent'
draft: false 
lang: ''
---

## 前言：我为什么从 OpenClaw 转向 ZeroClaw？（一段真实折腾小故事）
我是一名个人站长，手里长期跑着博客、工具站、小服务，主力机器是一台**轻量云服务器**：4核4G，带宽不高。

之前一段时间，我一直在使用 **OpenClaw** 作为我的 AI 智能体 / 自动化机器人框架。客观说，OpenClaw 功能非常完善：插件丰富、接入平台多、配置灵活、生态成熟，能满足我几乎所有自动化需求。我用它做消息机器人、定时任务、API 中转、内容处理，用得很顺手。

但随着运行时间变长，两个问题开始变得**无法忽视**：
1. **资源占用偏高**
   - 启动后内存常驻 **300MB~800MB** 浮动
   - 高峰期 CPU 占用会明显上涨，影响同机器上的网站响应速度
2. **启动与重载速度偏慢**
   - 每次修改配置、重启服务，都需要等待数秒甚至更久
   - 偶尔遇到长时间运行后内存占用持续升高，需要定期重启才能维持稳定

对于一台还要跑 Nginx、MySQL、博客面板的小机器来说，这变成了一种“甜蜜的负担”：我需要它的能力，但又怕它把机器拖慢。

于是我开始寻找一种**更轻、更稳、启动更快、长期挂机不折腾**的替代方案——直到我遇到了 **ZeroClaw**。

ZeroClaw 给我的第一印象就是：
**极致精简、零依赖、单文件、内存占用个位数到几十 MB、启动毫秒级。**

它不是要取代谁，而是**在低配环境、长期后台运行、极简稳定**这个方向上，给出了一套完全不同的解决方案。

接下来，我将用**超详细、可复现、一步一操作**的方式，完整记录：
**如何从 0 部署 ZeroClaw，并提供两种部署方式：**
- 方式一：**宝塔面板纯可视化部署**
- 方式二：**标准命令行部署**

全文偏长、步骤极细，你可以直接当成**部署手册**使用。

---

# 一、ZeroClaw 项目基础信息
## 1.1 官方仓库
- **ZeroClaw 官方 GitHub**：
  **https://github.com/zeroclaw-labs/zeroclaw**
  ::github{repo="zeroclaw-labs/zeroclaw"}
## 1.2 项目核心特点（部署前理解）
- 语言：**Rust**
- 分发：**单二进制文件**
- 依赖：**零系统依赖**，不用装 Node、Python、Docker、环境变量
- 体积：**≈3~5 MB**
- 内存：空闲 **5~20 MB**，运行 **30~80 MB**
- 启动：**<100ms**
- 平台：Linux x86_64 / ARM / Windows / macOS 全支持
## 1.3 本文适用环境
- 操作系统：**Linux（CentOS / Ubuntu / Debian 均可）**
- 管理面板：**宝塔面板（推荐）**
- 架构：x86_64（ARM 步骤基本一致）
- 用途：AI Agent、机器人、自动化任务、API 调用、工具调度

---

# 二、部署前准备
## 2.1 确定你要放程序的目录
建议路径（干净、好记）：
```
/www/server/zeroclaw/
```
或在网站目录下新建：
```
/www/wwwroot/zeroclaw/
```

> 不建议放在临时目录、桌面、带中文/空格的路径。

## 2.2 准备配置信息
ZeroClaw 运行最少需要：
1. LLM 模型配置（OpenAI 格式 API）
   - api_key
   - base_url（可选，国内中转用）
   - model 名称
2. （可选）机器人平台 Token
   - Discord / Telegram / WebHook 等

本文以**最通用的 LLM 对话 + 基础运行**为例，不讲复杂插件，保证一次跑通。

---

# 三、部署方式一：宝塔面板部署
## 3.1 第一步：在宝塔创建程序目录
1. 打开宝塔左侧 **「文件」**
2. 进入 `/www/server/`
3. 右上角 **「新建目录」** → 目录名：`zeroclaw`
4. 进入 `/www/server/zeroclaw/`
## 3.2 第二步：下载最新版 ZeroClaw 二进制
打开官方 Release 页：
https://github.com/zeroclaw-labs/zeroclaw/releases

找到对应你机器的版本：
- Linux x86_64：`zeroclaw-linux-x86_64`
- Linux ARM64：`zeroclaw-linux-arm64`

**两种下载方法：**

### 方法 A：面板直接下载
在 `/www/server/zeroclaw/` 目录下：
- 点击 **「远程下载」**
- 选择 **「下载文件」**
- 粘贴对应版本的 **直链**
- 等待下载完成

### 方法 B：本地上传
- 下载到电脑
- 宝塔面板 **「上传」**
- 拖入文件

最终目录结构：
```
/www/server/zeroclaw/zeroclaw-linux-x86_64
```

## 3.3 第三步：面板里给程序加执行权限
很多人部署失败，就是**没给权限**。

1. 选中 `zeroclaw-linux-x86_64`
2. 右键 → **「权限」**
3. 修改权限为：**755**
4. 确认

> 权限解释：755 = 所有者可读写执行，其他可读执行。

## 3.4 第四步：生成默认配置文件
我们用宝塔的 **「计划任务 → 执行shell命令」** 临时跑一次：

左侧 **「计划任务」** → **添加任务**
- 任务类型：**Shell 脚本**
- 任务名称：生成 ZeroClaw 配置
- 执行脚本：
```bash
cd /www/server/zeroclaw
./zeroclaw-linux-x86_64 init
```
- 点击 **「立即执行」**

执行成功后，你会在目录里看到：
```
config.toml
```
这就是配置文件。

## 3.5 第五步：面板可视化编辑 config.toml
1. 回到文件列表
2. 点击 `config.toml` 打开编辑
3. 按下面模板填写（最通用稳定版）

### 最小可用配置
```toml
# ==============================================
# ZeroClaw 通用最小配置
# ==============================================

[app]
name = "ZeroClaw"
mode = "prod"
log_level = "info"

[llm]
provider = "openai"
api_key = "此处填你的 API Key"
base_url = "https://api.openai.com/v1"  # 国内中转可改
model = "gpt-3.5-turbo"
max_tokens = 1024
temperature = 0.7

# 启用 CLI 模式（本地运行测试）
[channels.cli]
enable = true

# 其他平台如 Discord、Telegram 按需开启
[channels.discord]
enable = false
token = ""

[channels.telegram]
enable = false
token = ""

# 安全配置
[security]
allow_commands = []
max_tools_per_call = 3
```

编辑完成后**保存**。

## 3.6 第六步：测试运行
再次进入 **计划任务**，新建一个测试任务：

```bash
cd /www/server/zeroclaw
./zeroclaw-linux-x86_64 run
```

点击**立即执行**，查看输出：
- 出现 `ZeroClaw started` 类似字样 = 启动成功
- 出现 CLI 交互 = 正常运行

## 3.7 第七步：配置后台守护
这是面板部署**最关键一步**：让它**开机自启、崩溃自动重启、后台常驻**。

### 使用宝塔「Supervisor 管理器」
1. 宝塔左侧 **「软件商店」**
2. 搜索 **Supervisor** → 安装
3. 打开 Supervisor → **「添加守护进程」**

填写：
- 名称：ZeroClaw
- 启动用户：root
- 运行目录：`/www/server/zeroclaw`
- 启动命令：
```
./zeroclaw-linux-x86_64 daemon
```
- 进程数：1
- 自动启动：勾选
- 自动重启：勾选

保存 → 启动 → 查看状态：
**显示「运行中」= 部署完成！**

---

# 四、部署方式二：标准命令行完整版
适合习惯 SSH、喜欢干净、不想装面板工具的用户。
**全程复制粘贴即可。**

## 4.1 创建目录
```bash
mkdir -p /www/server/zeroclaw
cd /www/server/zeroclaw
```

## 4.2 下载二进制（以 x86_64 为例）
```bash
wget -O zeroclaw https://github.com/zeroclaw-labs/zeroclaw/releases/latest/download/zeroclaw-linux-x86_64
```

## 4.3 加权限
```bash
chmod +x zeroclaw
```

## 4.4 生成配置
```bash
./zeroclaw init
```

## 4.5 编辑配置
```bash
vim config.toml
```

按上面的模板填写，保存：
```
:wq
```

## 4.6 前台测试运行
```bash
./zeroclaw run
```

看到启动成功，按 `Ctrl+C` 退出。

## 4.7 后台守护运行
```bash
nohup ./zeroclaw daemon > zeroclaw.log 2>&1 &
```

## 4.8 查看进程与日志
```bash
# 查看是否运行
ps aux | grep zeroclaw

# 实时看日志
tail -f zeroclaw.log
```

## 4.9 设置开机自启
创建服务文件：
```bash
vim /etc/systemd/system/zeroclaw.service
```

写入：
```ini
[Unit]
Description=ZeroClaw Agent
After=network.target

[Service]
User=root
WorkingDirectory=/www/server/zeroclaw
ExecStart=/www/server/zeroclaw/zeroclaw daemon
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

启用：
```bash
systemctl daemon-reload
systemctl enable zeroclaw
systemctl start zeroclaw
```

管理命令：
```bash
systemctl start zeroclaw
systemctl stop zeroclaw
systemctl restart zeroclaw
systemctl status zeroclaw
```

---

# 五、ZeroClaw 配置文件详细解读
## 5.1 全局 app 配置
```toml
[app]
name = "ZeroClaw"          # 实例名称
mode = "prod"              # 模式 dev / prod
log_level = "info"         # 日志级别 error/warn/info/debug
```

## 5.2 LLM 核心配置
```toml
[llm]
provider = "openai"        # 目前固定 openai 格式
api_key = "sk-xxxx"        # 你的 key
base_url = "https://..."   # 中转地址
model = "gpt-3.5-turbo"    # 模型名
max_tokens = 1024
temperature = 0.7
```

## 5.3 通道（Channels）配置
你可以把通道理解为**接入平台**：
```toml
[channels.cli]       # 命令行聊天
enable = true        # 测试必开

[channels.discord]
enable = false
token = ""

[channels.telegram]
enable = false
token = ""
```

## 5.4 安全配置
```toml
[security]
allow_commands = []       # 允许执行的系统命令
max_tools_per_call = 3    # 单次最大工具调用
```
- 留空 = 不允许执行任何命令，最安全
- 个人使用可少量添加，如 `["echo", "curl"]`

---

# 六、启动模式详解
ZeroClaw 有两种启动方式，很多人搞混：

| 命令 | 用途 | 适合场景 |
|---|---|---|
| `./zeroclaw run` | 前台运行，会打印日志，Ctrl+C 停止 | 测试、调试、看错误 |
| `./zeroclaw daemon` | 后台守护模式，长期运行 | 正式部署、开机自启 |

**正式部署一定用 daemon。**

---

# 七、资源占用实测对比
我在同一台机器、同一时段、空载状态下实测：

| 指标 | OpenClaw | ZeroClaw |
|---|---:|---:|
| 文件体积 | ~200MB | **3.4MB** |
| 空闲内存 | 280~600MB | **5~20MB** |
| 运行内存 | 500MB+ | **30~80MB** |
| 启动时间 | 3~8 秒 | **<100ms** |
| 依赖环境 | Node + 大量库 | 零依赖 |

**真实感受：**
ZeroClaw 运行后，你几乎感觉不到它的存在。
不抢内存、不抢CPU、不拖慢网站、不影响业务。

---

# 八、常见问题与排错
## 8.1 报错：permission denied
- 原因：没给执行权限
- 解决：`chmod +x zeroclaw` 或面板改 755

## 8.2 报错：config.toml 不存在
- 原因：没生成配置
- 解决：`./zeroclaw init`

## 8.3 LLM 连接失败
- 检查 api_key
- 检查 base_url 是否可访问
- 检查机器能否出口访问对应 API

## 8.4 后台运行一会儿就挂
- 解决：用 `daemon` 模式 + systemd 或 Supervisor 守护

## 8.5 如何完全关闭
```bash
pkill -f zeroclaw
```

---

# 九、总结：一次让机器“松一口气”的迁移
从 OpenClaw 转向 ZeroClaw，对我来说不是“替换”，而是**场景互补**。

- OpenClaw 依然是**功能全面、生态成熟**的优秀框架
- ZeroClaw 则在**轻量、极简、稳定、高性能**上走出了自己的路线

对我这种**个人站长 + 低配机器 + 长期挂机**的用户来说：
**ZeroClaw 几乎是最优解。**

它安静、小巧、飞快、稳定，
像一个默默干活、从不添麻烦的小助手。

如果你也被内存占用、启动速度、环境折腾烦了，
不妨试试 ZeroClaw，
也许它会成为你服务器上**最省心的那个工具**。