---
title: 简幻欢部署Leaves 1.21.3养老服，从零搭建到插件配置全记录
published: 2026-05-07
description: '使用简幻欢面板部署Minecraft Java版Leaves 1.21.3服务端，配置双认证、多地图，打造一个纯净养老服务器'
image: ''
tags: [Minecraft, 服务器运维]
category: '游戏折腾'
draft: false
lang: ''
---

折腾了一段时间，终于把我的Minecraft养老服搭好了。用的是[简幻欢](https://simpfun.cn/auth?type=register&code=308534106)面板 + [Leaves](https://leavesmc.org) 1.21.3服务端，支持[红石皮肤站](https://redstoneskin.com)和官方正版双认证，多地图（生存、创造独立世界），整体体验还不错。记录一下整个部署过程和插件配置，给同样想开服的朋友参考。

# 一、为什么选简幻欢 + Leaves

## 1.1 简幻欢面板

[简幻欢](https://simpfun.cn/auth?type=register&code=308534106)是国内比较流行的Minecraft服务器托管面板，优点：

- 操作简单，图形化界面，不需要太多命令行知识
- 一键部署，支持多种服务端
- 自带文件管理、控制台、定时任务等功能
- 国内访问速度快，客服响应及时
- 价格合理，适合个人小型服务器

## 1.2 Leaves服务端

[Leaves](https://leavesmc.org)是基于[Paper](https://papermc.io)/[Purpur](https://purpurmc.org)的高性能Minecraft服务端分支，针对国内社区做了一些优化：

- 性能比原版Paper更好，内存占用更低
- 修复了一些Paper的已知Bug
- 保持了对Paper/Spigot插件的兼容性
- 社区活跃，更新及时

插件可以在 [SpigotMC](https://www.spigotmc.org/resources/) 或 [Hangar](https://hangar.papermc.io) 下载。

选择Leaves而不是Paper的原因主要是它在某些场景下的性能表现更好，尤其是实体数量多的时候。

# 二、服务器部署

## 2.1 创建服务器实例

在简幻欢面板中：

1. 点击"创建服务器"
2. 选择"Minecraft Java版"
3. 服务端选择"Leaves"
4. 版本选择"1.21.3"
5. 配置服务器参数（内存建议至少2GB）
6. 点击创建，等待初始化完成

## 2.2 基础配置

服务器创建后，先修改`server.properties`：

```properties
# 服务器名称
motd=§a§l B+.I.L.L §r- §7纯净养老服

# 最大玩家数
max-players=20

# 游戏模式
gamemode=survival

# 难度
difficulty=normal

# 视距（根据服务器性能调整）
view-distance=10

# 模拟距离
simulation-distance=8

# 关闭正版验证（配合authlib-injector使用）
online-mode=false

# 关闭PVP（养老服不需要）
pvp=false

# 世界种子
level-seed=你的种子

# 世界类型
level-type=minecraft\:normal
```

## 2.3 JVM启动参数

在简幻欢面板的启动参数配置中，建议使用以下参数：

```bash
-javaagent:authlib-injector.jar=api.mojang.com
-Xms2G -Xmx4G
-XX:+UseG1GC
-XX:+ParallelRefProcEnabled
-XX:MaxGCPauseMillis=200
-XX:+UnlockExperimentalVMOptions
-XX:+DisableExplicitGC
-XX:+AlwaysPreTouch
-XX:G1NewSizePercent=30
-XX:G1MaxNewSizePercent=40
-XX:G1HeapRegionSize=8M
-XX:G1ReservePercent=20
-XX:G1HeapWastePercent=5
-XX:G1MixedGCCountTarget=4
-XX:InitiatingHeapOccupancyPercent=15
-XX:G1MixedGCLiveThresholdPercent=90
-XX:G1RSetUpdatingPauseTimePercent=5
-XX:SurvivorRatio=32
-XX:+PerfDisableSharedMem
-XX:MaxTenuringThreshold=1
-Dusing.aikars.flags=https://mcflags.emc.gs  # Aikar's Flags: https://mcflags.emc.gs
-Daikars.new.flags=true
```

# 三、双认证配置

养老服最大的痛点之一就是账号安全。我配置了双认证：支持[红石皮肤站](https://redstoneskin.com)（外置登录）和官方正版登录，两种玩家都能进服。

## 3.1 authlib-injector配置

[authlib-injector](https://github.com/yushijinhun/authlib-injector)是实现外置登录的核心，通过Java agent注入替换认证服务器：

```bash
# 下载authlib-injector
wget https://github.com/yushijinhun/authlib-injector/releases/latest/download/authlib-injector.jar

# 放到服务器根目录
# 在JVM参数中添加：
-javaagent:authlib-injector.jar=api.mojang.com
```

## 3.2 双认证插件

使用支持双认证的插件，让正版玩家和皮肤站玩家都能正常登录：

```yaml
# plugins/DualAuth/config.yml（示例配置）
auth:
  # 启用双认证模式
  mode: dual

  # 正版认证
  mojang:
    enabled: true

  # 外置登录（红石皮肤站）
  custom-yggdrasil:
    enabled: true
    api-url: "https://api.example.com"  # 红石皮肤站API地址

  # 安全设置
  security:
    # 防止用户名冲突
    prevent-name-conflict: true
    # 正版玩家优先
    mojang-priority: true
```

## 3.3 登录流程

配置完成后，玩家的登录流程：

- **正版玩家：** 直接用正版账号登录，自动通过Mojang认证
- **皮肤站玩家：** 使用红石皮肤站账号登录，通过authlib-injector验证
- **防冲突：** 如果用户名被正版玩家占用，皮肤站玩家会收到提示

# 四、多地图配置

我想在同一个服务端下实现多个独立世界：一个生存世界、一个创造世界，玩家可以自由切换。

## 4.1 多世界插件

使用[Multiverse-Core](https://github.com/Multiverse/Multiverse-Core)实现多世界管理：

```bash
# 安装Multiverse-Core
# 下载插件jar放到plugins目录
```

## 4.2 创建多世界

```bash
# 在控制台或游戏内执行

# 创建生存世界
mv create world_survival normal -s 种子1 -t flat

# 创建创造世界
mv create world_creative normal -s 种子2 -t flat

# 设置默认世界
mv modify set spawn true world_survival
```

## 4.3 世界配置

```yaml
# plugins/Multiverse-Core/worlds.yml
worlds:
  world_survival:
    alias: 生存世界
    game-mode: survival
    difficulty: normal
    pvp: false
    spawn-location:
      x: 0
      y: 64
      z: 0

  world_creative:
    alias: 创造世界
    game-mode: creative
    difficulty: peaceful
    pvp: false
```

## 4.4 传送系统

配合[EssentialsX](https://essentialsx.net)的传送命令，让玩家自由切换世界：

```bash
# 玩家使用命令切换世界
/mv tp world_survival  # 传送到生存世界
/mv tp world_creative  # 传送到创造世界

# 或者设置传送门
# 在生存世界放一个末地传送门，进入后传送到创造世界
```

# 五、插件推荐

以下是我养老服用的插件清单，都是经过测试兼容Leaves 1.21.3的：

## 5.1 核心插件

| 插件 | 用途 | 说明 |
|------|------|------|
| **[EssentialsX](https://essentialsx.net)** | 基础指令 | 家、传送、经济、邮件，养老服必备 |
| **[LuckPerms](https://luckperms.net)** | 权限管理 | 功能强大，支持群组和继承 |
| **[Vault](https://www.spigotmc.org/resources/vault.34315)** | 经济API | 很多插件的前置依赖 |
| **[PlaceholderAPI](https://www.spigotmc.org/resources/placeholderapi.6245)** | 变量API | 显示变量信息，很多插件依赖 |

## 5.2 保护类插件

| 插件 | 用途 | 说明 |
|------|------|------|
| **[WorldGuard](https://enginehub.org/worldguard)** | 区域保护 | 保护重要区域不被破坏 |
| **[GriefPrevention](https://www.spigotmc.org/resources/griefprevention.1884)** | 领地系统 | 玩家自己圈地保护建筑 |
| **[CoreProtect](https://www.spigotmc.org/resources/coreprotect.8631)** | 日志回滚 | 记录所有方块操作，可回滚熊孩子破坏 |

```yaml
# CoreProtect配置建议
# 记录所有方块操作
logging:
  blocks: true
  containers: true
  entities: true
  chat: true
  commands: true
```

## 5.3 休闲养老插件

| 插件 | 用途 | 说明 |
|------|------|------|
| **[McMMO](https://www.spigotmc.org/resources/mcmmo.2445)** | RPG技能 | 挖矿、伐木等技能升级，增加游戏深度 |
| **[Jobs Reborn](https://www.spigotmc.org/resources/jobs-reborn.4216)** | 职业系统 | 选择职业，工作赚钱 |
| **[PlayerWarps](https://www.spigotmc.org/resources/playerwarps.16578)** | 玩家传送点 | 玩家设置自己的传送点 |
| **[GSit](https://www.spigotmc.org/resources/gsit.62323)** | 坐下/躺下 | 可以坐在方块上，增加沉浸感 |
| **[ImageOnMap](https://www.spigotmc.org/resources/imageonmap.55066)** | 地图画 | 把图片显示在地图上，装饰用 |
| **[HeadDatabase](https://www.spigotmc.org/resources/head-database.14280)** | 头颅库 | 各种装饰头颅 |

## 5.4 经济和商店

| 插件 | 用途 | 说明 |
|------|------|------|
| **[Shopkeepers](https://www.spigotmc.org/resources/shopkeepers.80756)** | NPC商店 | 创建NPC商店，方便交易 |
| **[ChestShop](https://www.spigotmc.org/resources/chestshop.51856)** | 箱子商店 | 玩家用牌子创建商店 |
| **[EssentialsX Economy](https://essentialsx.net)** | 经济系统 | 基础经济功能 |

## 5.5 实用工具

| 插件 | 用途 | 说明 |
|------|------|------|
| **[Spark](https://spark.lucko.me)** | 性能监控 | 监控TPS、内存、GC等 |
| **[ViaVersion](https://viaversion.com)** | 跨版本 | 允许不同版本的客户端连接 |
| **[TAB](https://www.spigotmc.org/resources/tab.57806)** | Tab列表 | 美化Tab列表和名牌 |
| **[DiscordSRV](https://www.discordsrv.com)** | Discord联动 | 游戏内聊天同步到Discord |

## 5.6 插件配置示例

EssentialsX的养老服配置：

```yaml
# plugins/Essentials/config.yml
teleport-cooldown: 3
teleport-delay: 3
homes:
  max-homes: 5
spawn:
  newbies-spawn: true
  spawn-location: world_survival
economy:
  enabled: true
  symbol: '§a$'
```

LuckPerms权限组配置：

```bash
# 创建默认玩家组
lp creategroup player

# 设置默认组权限
lp group player permission set essentials.home true
lp group player permission set essentials.sethome true
lp group player permission set essentials.tpahere true
lp group player permission set mv.tp true

# 设置默认组为新玩家的组
lp setdefaultgroup player
```

# 六、种子推荐

1.21.3版本的几个不错的种子：

## 6.1 综合型种子

**种子：`8594160209012774623`**

- 出生点附近有村庄
- 不远处有掠夺者前哨站
- 周围地形丰富，有平原、森林、山脉
- 适合养老服开局

## 6.2 风景型种子

**种子：`2151901553968352745`**

- 出生点附近有樱花树林
- 不远处有裸岩山峰
- 周围有河流和峡谷
- 适合喜欢看风景的玩家

## 6.3 资源型种子

**种子：`2083148844`**

- 出生点附近有多个村庄
- 地下有丰富的矿洞
- 不远处有末地要塞
- 适合喜欢探索和刷资源的玩家

可以用 [Chunkbase](https://chunkbase.com/apps/seed-map) 查看种子的详细地图。

# 七、运维建议

## 7.1 定期备份

```bash
# 在简幻欢面板设置定时备份
# 建议每天凌晨备份一次
# 保留最近7天的备份
```

## 7.2 性能监控

```bash
# 安装Spark插件后
/spark tps    # 查看TPS
/spark memory # 查看内存使用
/spark health # 查看服务器健康状态
```

## 7.3 实体清理

```yaml
# 安装ClearLagg或类似插件
# 定期清理掉落物和多余实体
# ClearLagg下载：https://www.spigotmc.org/resources/clearlagg.36899
```

# 八、服务器地址

如果你也想找一个纯净养老服玩，可以来我的服务器看看：

**[mc.mgstudio.icu](http://mc.mgstudio.icu)**

服务器信息：
- 版本：Leaves 1.21.3
- 类型：纯净养老服
- 地图：多世界（生存 + 创造）
- 认证：双认证（正版 + 红石皮肤站）
- PVP：关闭
- 白名单：暂无，欢迎来玩

# 九、总结

用简幻欢 + Leaves搭建养老服的体验整体不错。简幻欢的面板操作很方便，Leaves的性能表现也很好。双认证的配置稍微麻烦一点，但一次配好之后就不用管了。

最重要的还是选好插件，养老服的核心就是"养老"，不要装太多花里胡哨的插件，保持纯净，让玩家能安安静静地建房子、挖矿、看风景就好。

欢迎来 mc.mgstudio.icu 找我玩。
