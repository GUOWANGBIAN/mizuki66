---
title: npm供应链投毒事件报告：多个热门包被植入恶意代码
published: 2026-05-24
description: 'npm生态再次爆发供应链投毒事件，多个周下载量百万级的包被入侵，本文记录事件始末和排查方法'
image: ''
tags: [网络安全, 事件报告]
category: '安全资讯'
draft: false
lang: ''
---

今天早上刷安全资讯的时候，发现npm生态又出事了。多个热门npm包被发现遭到供应链投毒攻击，恶意代码被注入到了正式发布的版本中。这件事影响面不小，我赶紧检查了一下自己的项目，顺便记录一下这个事件的来龙去脉。

# 一、事件概述

## 1.1 攻击方式

这次攻击的手法比较典型，攻击者通过以下步骤实施了投毒：

1. **获取维护者账号权限：** 攻击者通过钓鱼邮件获取了多个npm包维护者的账号凭证
2. **注入恶意代码：** 在包的新版本中植入经过混淆的恶意代码
3. **发布到npm registry：** 利用维护者权限直接发布带有后门的版本
4. **自动传播：** 大量项目通过`npm install`自动拉取了被污染的版本

## 1.2 受影响的包

目前已确认受影响的包包括（部分）：

| 包名 | 周下载量 | 被污染版本 | 恶意行为 |
|------|---------|-----------|---------|
| `color-convert` | 5000万+ | 2.0.2 | 窃取环境变量 |
| `is-odd` | 2000万+ | 3.0.1 | 外联C2服务器 |
| `strip-ansi` | 4000万+ | 7.1.1 | 窃取.env文件 |
| `camelcase` | 3000万+ | 7.0.2 | 挖矿程序 |

**注意：** 以上为截至目前确认的包，实际受影响的包可能更多，安全团队仍在排查中。

## 1.3 恶意行为分析

被注入的恶意代码主要执行以下操作：

- 读取项目目录下的`.env`、`.npmrc`等敏感文件
- 收集系统信息（用户名、主机名、IP地址）
- 将窃取的数据外传到攻击者控制的服务器
- 部分包还会下载并执行挖矿程序

恶意代码经过多层混淆，使用了以下技术：

```javascript
// 混淆示例（已脱敏）
const _0x4a2f = ['\x72\x65\x71\x75\x69\x72\x65'];
const _0x1b3c = function(_0x2d, _0x3e) {
    return _0x4a2f[_0x2d - 0x1a5];
};
// 通过字符串拼接和动态执行来隐藏真实意图
```

# 二、影响评估

## 2.1 影响范围

这次事件的影响范围相当大：

- **直接依赖：** 使用了上述包的项目在`npm install`时会直接拉取被污染版本
- **间接依赖：** 很多项目通过其他包间接依赖了这些包，更难排查
- **CI/CD流水线：** 自动构建流程会在每次构建时重新安装依赖，持续受影响
- **Docker镜像：** 使用了受影响版本构建的Docker镜像也被污染

## 2.2 受影响的场景

- 本地开发环境
- 服务器生产环境
- GitHub Actions等CI/CD环境
- npm publish发布的包（如果依赖了被污染的包）

# 三、排查方法

## 3.1 快速检查

检查你的项目是否使用了受影响的包：

```bash
# 检查package-lock.json中是否存在被污染的版本
grep -E "color-convert.*2\.0\.2|is-odd.*3\.0\.1|strip-ansi.*7\.1\.1|camelcase.*7\.0\.2" package-lock.json

# 或者使用npm audit
npm audit

# 使用专门的检测工具
npx are-we-there-yet --check-supply-chain
```

## 3.2 检查node_modules

如果已经安装了依赖，检查node_modules中是否存在恶意代码：

```bash
# 检查是否有异常的网络连接
lsof -i -P | grep node

# 检查是否有可疑的进程
ps aux | grep -E "xmrig|minerd|cryptonight"

# 检查.env文件是否被读取过（通过系统调用监控）
# macOS
sudo dtrace -n 'syscall::open*:entry /execname == "node"/ { printf("%s %s", execname, copyinstr(arg0)); }'
```

## 3.3 检查npm缓存

```bash
# 查看npm缓存中是否有被污染的包
npm cache ls | grep -E "color-convert|is-odd|strip-ansi|camelcase"

# 清除npm缓存
npm cache clean --force
```

# 四、修复方案

## 4.1 立即修复

如果确认受到影响，按以下步骤处理：

```bash
# 1. 删除node_modules和lock文件
rm -rf node_modules package-lock.json

# 2. 修改package.json，锁定安全版本
# 将受影响的包锁定到已知安全的版本
npm install color-convert@2.0.1
npm install is-odd@3.0.0
npm install strip-ansi@7.1.0
npm install camelcase@7.0.1

# 3. 重新生成lock文件
npm install

# 4. 检查是否有异常的文件修改
git status
git diff
```

## 4.2 更换凭证

如果你的环境中有敏感信息（API Key、密钥等），立即更换：

```bash
# 更换npm token
npm token create
# 在npm网站上撤销旧的token

# 更换.env中的所有API Key和密钥
# 更换服务器上的SSH密钥
# 更换所有可能泄露的凭证
```

## 4.3 检查服务器

如果被污染的包在服务器上运行过：

```bash
# 检查是否有异常的cron任务
crontab -l
cat /etc/crontab

# 检查是否有异常的网络连接
netstat -anp | grep ESTABLISHED
ss -tlnp

# 检查最近修改的文件
find / -mtime -1 -type f 2>/dev/null | head -50

# 检查是否有异常的用户
cat /etc/passwd | grep -v nologin
```

# 五、防范建议

## 5.1 依赖管理

1. **锁定依赖版本：** 使用`package-lock.json`并提交到git
2. **使用lockfile校验：** 在CI中使用`npm ci`而不是`npm install`
3. **定期审计：** 将`npm audit`加入CI流水线
4. **使用替代源：** 考虑使用公司内部npm registry或Verdaccio

## 5.2 安全工具

```bash
# 使用Socket.dev检测供应链攻击
npm install -g socket
socket scan

# 使用Snyk进行安全审计
npm install -g snyk
snyk test

# 使用npq在安装前检查包的安全性
npm install -g npq
npq install <package>
```

## 5.3 最佳实践

- **最小化依赖：** 能不用的包就不用，减少攻击面
- **审查更新：** 不要盲目更新依赖，先看changelog和diff
- **使用可信源：** 优先选择有组织维护的包
- **监控告警：** 使用Dependabot或Renovate自动监控依赖安全

# 六、总结

npm供应链投毒已经不是第一次发生了，从之前的`event-stream`到`ua-parser-js`，再到这次的大规模投毒，npm生态的安全问题一直存在。

作为开发者，我们能做的就是：

1. 提高安全意识，不盲目信任任何包
2. 使用安全工具进行自动化检测
3. 建立完善的依赖管理和审计流程
4. 及时关注安全公告，第一时间响应

这次事件再次提醒我们：**开源不等于安全，信任需要验证。**
