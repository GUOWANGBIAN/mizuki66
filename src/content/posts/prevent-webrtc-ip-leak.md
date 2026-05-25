---
title: 防止WebRTC泄露真实IP：浏览器插件与多种解决方案
published: 2026-03-22
description: 'WebRTC会绕过代理泄露真实IP，本文介绍多种防护方法'
image: ''
tags: [隐私保护, WebRTC, 网络安全]
category: '技术折腾'
draft: false
lang: ''
---

很多人以为挂了代理就万事大吉了，但其实WebRTC可以在你不知情的情况下泄露真实IP地址。这个问题在Chrome、Firefox等主流浏览器上都存在，而且默认开启。

今天聊聊WebRTC泄露的原理和防护方法。

# 一、什么是WebRTC

WebRTC（Web Real-Time Communication）是一套支持浏览器之间进行实时音视频通信的技术标准。你用浏览器开视频会议、语音通话、P2P文件传输，底层基本都是WebRTC。

它的优点是延迟低、不需要安装插件，但有个问题：为了建立P2P连接，WebRTC需要获取你的真实IP地址，包括局域网IP和公网IP。

# 二、为什么会泄露IP

正常情况下，你挂了代理之后，网站看到的IP应该是代理服务器的IP。但WebRTC有个机制叫STUN（Session Traversal Utilities for NAT），它会绕过浏览器的代理设置，直接向STUN服务器请求你的真实IP。

这个过程是这样的：

1. 网页加载时，JavaScript可以调用WebRTC API
2. WebRTC向STUN服务器发送请求，获取你的公网IP和局域网IP
3. 这些IP信息会被传递给网页中的JavaScript代码
4. 网站可以通过这些IP识别你的真实位置

更麻烦的是，这个过程对用户完全透明，你在浏览器里看不到任何提示。

# 三、检测是否泄露

在防护之前，先检测一下你的浏览器是否存在WebRTC泄露：

**检测网站**：
- browserleaks.com/webrtc
- ipleak.net
- whatismyipaddress.com/webrtc-leak

打开这些网站，看显示的IP地址。如果你挂了代理，但网站显示了你的真实IP，那就是存在WebRTC泄露。

# 四、浏览器插件方案

最简单的方案是安装浏览器插件来禁用或伪装WebRTC。

## 4.1 Chrome浏览器

**WebRTC Leak Prevent**

这是最常用的防护插件，安装后直接生效。

安装方法：
1. 打开Chrome应用商店
2. 搜索"WebRTC Leak Prevent"
3. 安装并启用

插件会拦截WebRTC的IP请求，阻止真实IP泄露。你可以在插件设置中选择不同的模式：
- **禁用WebRTC**：完全禁用WebRTC功能
- **使用代理IP**：让WebRTC只使用代理分配的IP
- **默认公共接口**：只暴露公共IP，隐藏局域网IP

**WebRTC Control**

另一个不错的选择，提供一键开关功能，方便你在需要使用WebRTC时临时开启。

## 4.2 Firefox浏览器

**Disable WebRTC**

Firefox上的老牌插件，安装后直接禁用WebRTC功能。

安装方法：
1. 打开Firefox附加组件商店
2. 搜索"Disable WebRTC"
3. 安装并启用

**WebRTC Leak Shield**

另一个选择，提供更细粒度的控制。

## 4.3 Edge浏览器

Edge基于Chromium内核，可以直接使用Chrome的插件。在Edge中打开Chrome应用商店，安装上面提到的插件即可。

# 五、浏览器原生设置

除了插件，还可以通过浏览器自身的设置来禁用WebRTC。

## 5.1 Firefox设置

Firefox提供了原生的WebRTC控制选项：

1. 地址栏输入`about:config`，回车
2. 搜索`media.peerconnection.enabled`
3. 双击将其值改为`false`

这样就完全禁用了WebRTC功能。如果需要恢复，改回`true`即可。

其他相关设置：

```
media.peerconnection.enabled = false          # 禁用WebRTC
media.peerconnection.turn.disable = true      # 禁用TURN服务器
media.peerconnection.use_document_iceservers = false  # 禁用文档ICE服务器
media.peerconnection.video.enabled = false    # 禁用视频
media.peerconnection.identity.timeout = 1     # 设置超时时间
```

## 5.2 Chrome设置

Chrome没有像Firefox那样的原生设置界面，但可以通过启动参数来控制：

```
--disable-webrtc-multiple-routes
--disable-webrtc-hw-encoding
--disable-webrtc-hw-decoding
--enforce-webrtc-ip-permission-check
```

不过这种方式比较麻烦，而且不一定完全有效。建议还是用插件方案。

## 5.3 Edge设置

Edge同样没有原生的WebRTC控制选项，使用插件是更好的选择。

# 六、网络层面防护

如果你想在网络层面统一防护，可以考虑以下方案。

## 6.1 路由器层面

一些高级路由器支持在固件层面禁用WebRTC相关的流量。具体方法取决于你的路由器型号和固件。

对于OpenWrt路由器，可以安装相关插件或配置防火墙规则来阻止STUN流量。

## 6.2 防火墙规则

在操作系统层面，可以通过防火墙阻止STUN服务器的通信。

STUN服务器通常使用UDP端口3478和5349，你可以添加防火墙规则阻止这些端口的出站流量。

Windows防火墙示例：
```
netsh advfirewall firewall add rule name="Block STUN" dir=out action=block protocol=udp remoteport=3478,5349
```

Linux iptables示例：
```
iptables -A OUTPUT -p udp --dport 3478 -j DROP
iptables -A OUTPUT -p udp --dport 5349 -j DROP
```

不过这种方式会完全阻止WebRTC功能，包括正常的音视频通信需求。

## 6.3 代理软件配置

一些代理软件支持在代理层面处理WebRTC流量：

**Clash**：在配置文件中添加规则，将STUN流量走代理或直接阻止

**V2Ray**：通过路由规则阻止STUN相关的域名和IP

**Shadowrocket**：在规则中添加STUN相关的阻止规则

# 七、移动设备防护

手机上的浏览器也存在WebRTC泄露问题。

## 7.1 Android

**Firefox for Android**

和桌面版一样，可以通过`about:config`禁用WebRTC：

1. 地址栏输入`about:config`
2. 搜索`media.peerconnection.enabled`
3. 设置为`false`

**Chrome for Android**

Chrome移动版没有直接的设置选项，建议使用Firefox。

## 7.2 iOS

**Safari**

Safari默认不支持WebRTC，所以不存在这个问题。但如果你使用的是基于Chromium的浏览器（如Chrome、Edge），就需要注意。

**Firefox for iOS**

iOS版Firefox使用的是WebKit内核，WebRTC的支持有限，泄露风险相对较小。

# 八、验证防护效果

配置完成后，一定要验证防护效果：

1. 访问browserleaks.com/webrtc
2. 检查显示的IP地址
3. 如果显示的是代理IP或完全没有IP信息，说明防护成功
4. 如果仍然显示真实IP，需要检查配置

建议定期检测，因为浏览器更新可能会改变WebRTC的行为。

# 九、注意事项

## 9.1 功能影响

禁用WebRTC后，以下功能会受到影响：

- 网页版视频会议（如Google Meet、腾讯会议网页版）
- 网页版语音通话
- P2P文件传输
- 部分在线游戏的实时功能

如果你经常使用这些功能，建议使用插件方案而不是完全禁用，这样可以在需要时临时开启。

## 9.2 插件选择

选择插件时注意：

- 查看插件的评价和下载量
- 检查插件的权限要求
- 优先选择开源插件
- 定期更新插件

## 9.3 浏览器更新

浏览器更新可能会重置一些设置，或者改变WebRTC的默认行为。更新后建议重新检查WebRTC泄露情况。

# 十、总结

防止WebRTC泄露的方法，按推荐程度排序：

1. **浏览器插件**：最简单，对功能影响最小，推荐大多数人使用
2. **浏览器原生设置**：Firefox用户首选，配置一次永久生效
3. **网络层面防护**：适合有技术基础的用户，可以统一防护多台设备
4. **防火墙规则**：最彻底，但会影响WebRTC相关功能

最简单的方案就是装个插件，一分钟搞定。如果你对隐私要求比较高，可以结合多种方案，多层防护。

隐私保护是个持续的过程，不是配一次就完事了。定期检测，及时更新，才能确保安全。