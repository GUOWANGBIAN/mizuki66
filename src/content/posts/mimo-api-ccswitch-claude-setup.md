---
title: 小米开放MIMO模型API，通过ccswitch将其接入Claude Code
published: 2026-05-03
description: '小米MIMO模型开放API邀请，获取token后通过ccswitch工具将MIMO接入Claude Code工作流'
image: ''
tags: [AI, 工具折腾]
category: 'AI实践'
draft: false
lang: ''
---

前几天看到小米正式开放了MIMO模型的API邀请，作为一个每天都在用Claude Code干活的人，我第一时间去申请了token，想着能不能把MIMO接到我的日常工作流里。折腾了一圈之后，发现通过ccswitch这个工具可以很方便地在Claude Code里切换使用MIMO。记录一下整个过程。

# 一、关于小米MIMO

小米的MIMO（MiMo）模型是小米AI团队推出的大语言模型，主打推理能力。之前一直没开放公开API，只能在小米自己的产品里体验。这次开放邀请制的API访问，算是给开发者开了一个口子。

MIMO的几个特点：

- 推理能力不错，尤其是数学和代码场景
- 中文理解能力较强，毕竟是国产模型
- API价格目前处于推广期，比较有竞争力
- 支持function call和长上下文

# 二、获取MIMO API Token

## 2.1 申请流程

1. 访问小米AI开放平台（ai.xiaomi.com）
2. 注册开发者账号并完成实名认证
3. 在模型广场找到MIMO，点击"申请内测"
4. 填写使用场景说明，等待审核（我的大概等了两天）
5. 审核通过后在控制台创建API Key

## 2.2 注意事项

- 目前是邀请制，不是申请就能过，写清楚使用场景会提高通过率
- API Key创建后只显示一次，记得保存
- 有调用频率限制，具体看你的邀请等级

# 三、通过ccswitch接入Claude Code

## 3.1 什么是ccswitch

ccswitch是一个Claude Code的模型切换工具，可以让你在Claude Code中快速切换不同的模型后端。它的原理是通过代理层拦截Claude Code的API请求，将其转发到你指定的模型服务上。

::github{repo="ccswitch/ccswitch"}

## 3.2 安装ccswitch

```bash
# 通过npm全局安装
npm install -g ccswitch

# 或者通过pnpm
pnpm add -g ccswitch
```

## 3.3 配置MIMO模型

安装完成后，编辑ccswitch的配置文件：

```bash
# 初始化配置
ccswitch init
```

在生成的配置文件中添加MIMO的配置：

```yaml
providers:
  mimo:
    name: "小米MIMO"
    api_base: "https://api.xiaomi.com/v1"
    api_key: "your-mimo-api-key-here"
    models:
      - id: "mimo-reasoning"
        name: "MIMO Reasoning"
        max_tokens: 8192
      - id: "mimo-chat"
        name: "MIMO Chat"
        max_tokens: 4096

routes:
  - name: "mimo-reasoning"
    provider: "mimo"
    model: "mimo-reasoning"
  - name: "mimo-chat"
    provider: "mimo"
    model: "mimo-chat"
```

## 3.4 在Claude Code中使用

配置完成后，可以通过以下方式切换：

```bash
# 查看当前可用的模型
ccswitch list

# 切换到MIMO推理模型
ccswitch use mimo-reasoning

# 切换回Claude
ccswitch use claude-sonnet

# 查看当前使用的模型
ccswitch current
```

切换后正常启动Claude Code即可，它会自动通过ccswitch的代理层将请求转发到MIMO：

```bash
claude
```

# 四、实际使用体验

## 4.1 中文场景

MIMO的中文能力确实不错，日常的代码注释、文档生成、问题分析都能胜任。和Claude相比，MIMO对国内技术生态的理解更到位一些，比如问它宝塔面板、小程序开发这类问题，回答会更接地气。

## 4.2 代码能力

代码方面MIMO的表现中规中矩。简单的CRUD、脚本编写没问题，但遇到复杂的架构设计或者需要深度推理的场景，和Claude还是有差距。不过作为日常辅助工具完全够用。

## 4.3 响应速度

MIMO的API响应速度挺快的，体感和Claude Sonnet差不多。在某些简单任务上甚至更快，可能是因为目前调用量还不大。

## 4.4 不足之处

- 长上下文处理能力不如Claude，超过一定长度后质量下降明显
- function call的支持还不够成熟，偶尔会格式不对
- 英文能力相比Claude有明显差距
- 文档和示例还比较少，遇到问题排查起来费劲

# 五、使用建议

基于这段时间的使用，我的建议是：

1. **日常中文对话和简单代码任务**：可以用MIMO，速度快且中文体验好
2. **复杂推理和架构设计**：还是切回Claude，这块MIMO还有差距
3. **成本敏感的场景**：MIMO目前的API价格很有优势，适合批量任务
4. **学习和探索**：值得尝试，多一个模型多一种思路

# 六、总结

小米MIMO开放API是个好消息，国产大模型又多了一个可用的选择。通过ccswitch接入Claude Code的方式也比较优雅，不用改变已有的工作流，随时可以切换。

当然，目前MIMO和Claude相比还有不小的差距，尤其是复杂推理和长上下文方面。但作为日常中文场景的补充，MIMO是个不错的选择。期待小米后续能持续迭代，把模型能力再提升一个台阶。
