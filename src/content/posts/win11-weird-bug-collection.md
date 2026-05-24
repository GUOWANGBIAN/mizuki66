---
title: Windows 11的奇葩Bug，每一个都让人血压飙升
published: 2026-05-21
description: '记录我在Windows 11上遇到的各种离谱Bug，从任务栏抽风到文件管理器摆烂，每一个都让人抓狂'
image: ''
tags: [Windows, 吐槽]
category: '日常折腾'
draft: false
lang: ''
---

Windows 11用了快两年了，整体体验确实比Windows 10好不少，UI更现代，动画更流畅。但微软的Bug制造能力也是一如既往地稳定——隔三差五就会冒出一些让人摸不着头脑的奇葩Bug。今天集中吐槽一下我这段时间遇到的那些离谱问题，顺便记录一下解决方案，给同样被折磨的朋友们参考。

# 一、任务栏集体摆烂

## 1.1 现象

某天开机后，任务栏突然不响应了。具体表现：

- 点击开始按钮没反应
- 任务栏图标可以显示，但点击任何图标都没反应
- 右键任务栏空白处不弹出菜单
- 任务栏上的时钟和通知区域还在更新

## 1.2 解决方案

这个Bug的罪魁祸首是Windows Explorer进程抽风了：

```powershell
# 方法一：重启Explorer
taskkill /f /im explorer.exe
start explorer.exe

# 方法二：如果方法一不行，清理图标缓存
Remove-Item -Path "$env:LOCALAPPDATA\IconCache.db" -Force
Remove-Item -Path "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\iconcache*" -Force
Remove-Item -Path "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\thumbcache*" -Force
taskkill /f /im explorer.exe
start explorer.exe

# 方法三：重置任务栏组件
Get-AppXPackage -AllUsers | Foreach {Add-AppxPackage -DisableDevelopmentMode -Register "$($_.InstallLocation)\AppXManifest.xml"}
```

## 1.3 根本原因

这个Bug通常出现在以下情况：

- Windows Update之后
- 安装了某些Shell扩展（比如7-Zip、Git的右键菜单扩展）
- 多显示器切换时

# 二、文件管理器内存泄漏

## 2.1 现象

文件管理器（explorer.exe）用了一段时间后，内存占用会飙到几个GB：

- 打开任务管理器一看，explorer.exe吃了3GB内存
- 系统变得越来越卡
- 关闭所有文件管理器窗口后内存也不释放

## 2.2 解决方案

```powershell
# 查看explorer.exe内存占用
Get-Process explorer | Select-Object Name, @{N='Memory(MB)';E={[math]::Round($_.WorkingSet64/1MB,2)}}

# 定期重启Explorer（写成计划任务）
# 创建一个快捷方式或脚本，每天凌晨自动重启Explorer
```

**临时方案：** 每天重启一次电脑（我知道这很蠢，但确实有效）。

**长期方案：** 等微软修复，或者使用第三方文件管理器（如Total Commander、Files App）。

# 三、右键菜单加载缓慢

## 3.1 现象

在桌面或文件管理器中右键时：

- 菜单要等2-5秒才弹出来
- 弹出后选项是逐个慢慢出现的
- 有时候点了"显示更多选项"后又要等好几秒

## 3.2 原因分析

Windows 11的新右键菜单（WinUI风格）加载速度慢的原因：

1. 新菜单需要动态加载Shell扩展
2. 某些第三方软件注册的右键菜单项拖慢了加载速度
3. .NET运行时的冷启动开销

## 3.3 解决方案

**方案一：直接跳过新菜单，使用经典右键菜单**

```powershell
# 注册表修改，直接使用经典右键菜单
reg add "HKCU\Software\Classes\CLSID\{86ca1aa0-a74e-4293-abe8-d26b6e0e8f1d}\InprocServer32" /f /ve
```

**方案二：使用Shift+右键**

按住Shift再右键，可以直接弹出经典菜单。

**方案三：清理无用的右键菜单项**

```powershell
# 使用ShellMenuView工具查看和禁用不必要的右键菜单项
# 下载地址：nirsoft.net/utils/shexview.html
```

# 四、蓝牙耳机连接后没声音

## 4.1 现象

蓝牙耳机连接成功后：

- 系统显示已连接
- 但播放声音还是从扬声器出来
- 切换音频输出设备时显示"已连接"但实际没声音
- 有时候过一会儿突然有声音，有时候要重启才能解决

## 4.2 解决方案

```powershell
# 方法一：重启蓝牙服务
Restart-Service bthserv
Restart-Service BTAGService

# 方法二：重新配对蓝牙设备
# 设置 > 蓝牙和设备 > 找到耳机 > 删除设备 > 重新配对

# 方法三：修改蓝牙音频编码
# 设置 > 系统 > 声音 > 输出设备 > 属性 > 格式
# 尝试切换不同的音频格式

# 方法四：更新蓝牙驱动
# 设备管理器 > 蓝牙 > 右键适配器 > 更新驱动
```

## 4.3 根本原因

Windows 11的蓝牙音频栈和某些蓝牙芯片存在兼容性问题，尤其是：

- Intel AX200/AX201系列无线网卡
- Realtek蓝牙芯片
- 使用AAC编码的蓝牙耳机

# 五、开始菜单搜索不工作

## 5.1 现象

在开始菜单搜索框输入文字：

- 搜索结果为空
- 或者搜索框完全不响应输入
- 有时候搜索结果只显示Web结果，不显示本地应用

## 5.2 解决方案

```powershell
# 方法一：重启Windows Search服务
Restart-Service WSearch

# 方法二：重建搜索索引
# 设置 > 隐私和安全性 > 搜索窗口 > 高级索引选项 > 高级 > 重建

# 方法三：重置Cortana/搜索组件
Get-AppxPackage Microsoft.Windows.Search | Reset-AppxPackage

# 方法四：修改注册表
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Search" /v BingSearchEnabled /t REG_DWORD /d 0 /f
```

# 六、更新后WiFi断断续续

## 6.1 现象

Windows Update之后：

- WiFi连接显示正常但网速极慢
- 频繁断连重连
- 网页加载超时，但ping正常

## 6.2 解决方案

```powershell
# 方法一：重置网络
netsh winsock reset
netsh int ip reset
ipconfig /release
ipconfig /renew
ipconfig /flushdns

# 方法二：修改WiFi电源管理
# 设备管理器 > 网络适配器 > WiFi适配器 > 属性 > 电源管理
# 取消勾选"允许计算机关闭此设备以节省电源"

# 方法三：修改WiFi高级属性
# 设备管理器 > 网络适配器 > WiFi适配器 > 属性 > 高级
# - Roaming Aggressiveness: 调低
# - Throughput Booster: 禁用
# - Wireless Mode: 调整为最新的标准

# 方法四：回滚WiFi驱动
# 设备管理器 > 网络适配器 > WiFi适配器 > 属性 > 驱动程序 > 回滚驱动程序
```

# 七、窗口拖动卡顿

## 7.1 现象

拖动窗口时：

- 窗口移动不流畅，有明显延迟
- 尤其是在多显示器环境下
- 游戏全屏切换回桌面后特别明显

## 7.2 解决方案

```powershell
# 方法一：关闭窗口动画
# 设置 > 辅助功能 > 视觉效果 > 动画效果 > 关闭

# 方法二：修改显卡设置
# NVIDIA控制面板 > 管理3D设置 > 电源管理模式 > 最高性能优先

# 方法三：关闭DPI缩放
# 右键应用程序 > 属性 > 兼容性 > 更改高DPI设置 > 勾选"替代高DPI缩放行为"
```

# 八、总结

Windows 11的这些Bug虽然不致命，但确实影响使用体验。总结一下应对策略：

1. **保持系统更新：** 很多Bug在后续更新中会被修复
2. **不要急着安装大版本更新：** 等一两个月看看反馈再更新
3. **学会使用命令行修复：** 大部分问题都有对应的PowerShell命令
4. **定期重启电脑：** 这是Windows的"万能解药"
5. **做好系统备份：** 出问题时可以快速回滚

话说回来，Windows 11的这些Bug虽然烦人，但比起macOS的玄学问题，至少还能找到解决方案。微软的工程师们加油吧，希望Windows 12能少出点Bug。

不过按照微软的传统艺能，Windows 12大概率会引入更多新Bug，然后花两年时间修完。Windows用户，永远在和Bug做斗争。
