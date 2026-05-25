---
title: OpenList接入EdgeOne国内版并解决token失效问题
published: 2026-03-15
description: '记录OpenList接入腾讯云EdgeOne国内版时遇到的token失效问题及解决方案'
image: ''
tags: [OpenList, EdgeOne, CDN, 网络优化]
category: '技术折腾'
draft: false
lang: ''
---

最近把OpenList接入了腾讯云的EdgeOne国内版，主要想用它的CDN加速和边缘计算能力。但接入后发现一个问题：用户登录状态老是失效，隔一段时间就要重新登录，体验很差。

折腾了一圈之后，终于解决了这个问题。记录一下整个过程。

# 一、为什么用EdgeOne国内版

OpenList本身是个文件列表程序，用来展示和管理各种网盘、存储服务的文件。我之前一直用Cloudflare的CDN，但国内访问速度不太理想，经常加载缓慢。

EdgeOne是腾讯云的CDN和边缘安全服务，国内版的优势：

- **国内节点多**：覆盖全国主要城市，访问速度快
- **支持边缘计算**：可以在边缘节点运行自定义逻辑
- **安全防护**：自带WAF、DDoS防护
- **价格合理**：比自建CDN便宜，比Cloudflare国内版稳定

对于OpenList这种需要在国内访问的服务，EdgeOne确实是个不错的选择。

# 二、接入EdgeOne的基本配置

## 2.1 域名配置

首先在EdgeOne控制台添加域名，配置回源地址指向你的OpenList服务。

```
域名：files.example.com
回源地址：你的OpenList服务器IP
回源端口：5244（OpenList默认端口）
协议：HTTP/HTTPS
```

## 2.2 SSL证书

建议开启HTTPS，在EdgeOne控制台上传或申请SSL证书。OpenList默认支持HTTPS，但通过EdgeOne代理后，需要在EdgeOne层面配置。

## 2.3 缓存规则

OpenList的静态资源（JS、CSS、图片）可以设置较长的缓存时间，但API接口和登录相关接口需要设置不缓存。

```
静态资源：缓存30天
API接口：不缓存
登录接口：不缓存
```

# 三、token失效问题的表现

接入EdgeOne后，用户登录OpenList，正常使用几分钟到几小时后，突然提示"token无效"或"登录已过期"，需要重新登录。

这个问题很烦人，尤其是你在浏览文件列表、下载文件的时候突然被踢出去。

# 四、问题原因分析

排查了一圈，发现问题出在几个地方：

## 4.1 EdgeOne的缓存机制

EdgeOne默认会缓存一些响应，包括带有`Set-Cookie`头的响应。如果登录接口的响应被缓存了，后续用户的登录请求会拿到过期的token。

## 4.2 IP地址变化

OpenList的token校验默认会绑定客户端IP。通过EdgeOne代理后，OpenList看到的客户端IP是EdgeOne节点的IP，而不是用户的真实IP。当用户请求被分配到不同的EdgeOne节点时，IP变化会导致token校验失败。

## 4.3 时间同步问题

EdgeOne节点和你的OpenList服务器之间如果有时间偏差，会导致token的过期时间校验出问题。

# 五、解决方案

## 5.1 配置EdgeOne不缓存关键接口

在EdgeOne控制台的缓存配置中，添加规则：

```
规则1：
  路径：/api/*
  缓存：不缓存

规则2：
  路径：/auth/*
  缓存：不缓存

规则3：
  路径：/login*
  缓存：不缓存
```

这样可以确保登录和认证相关的请求不会被EdgeOne缓存。

## 5.2 传递真实客户端IP

在EdgeOne的回源配置中，开启"传递真实客户端IP"功能。EdgeOne会通过`X-Forwarded-For`或`X-Real-IP`头传递用户的真实IP。

然后在OpenList的配置中，告诉它从这些头中获取客户端IP。

OpenList的配置文件（`data/config.json`）中，添加或修改：

```json
{
  "address": "0.0.0.0",
  "port": 5244,
  "behind_proxy": true,
  "real_ip_header": "X-Forwarded-For"
}
```

关键配置：
- `behind_proxy: true`：告诉OpenList它在反向代理后面
- `real_ip_header`：指定从哪个头获取真实IP

## 5.3 调整token过期时间

OpenList的token默认有效期是24小时。如果你的使用场景需要更长的登录状态，可以调长这个时间。

在OpenList的管理后台 -> 设置 -> 用户，找到token有效期设置，改成你需要的时间。建议不要设太长，7天左右比较合适。

## 5.4 确保时间同步

确保你的OpenList服务器时间同步正确：

```bash
# 检查当前时间
date

# 安装并启用NTP同步
apt install ntpdate
ntpdate ntp.aliyun.com

# 或者使用systemd-timesyncd
timedatectl set-ntp true
```

## 5.5 EdgeOne边缘函数处理（可选）

如果上面的方法还不够，可以用EdgeOne的边缘函数（Edge Functions）来处理token相关的逻辑。

在EdgeOne控制台 -> 边缘计算 -> 边缘函数，创建一个函数：

```javascript
export default async function fetch(request) {
  const url = new URL(request.url);
  
  // 对于登录和认证接口，添加特定的头部
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) {
    const headers = new Headers(request.headers);
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    
    const modifiedRequest = new Request(request, {
      headers: headers
    });
    
    return fetch(modifiedRequest);
  }
  
  return fetch(request);
}
```

这个函数会对API和认证接口强制添加不缓存的头部。

# 六、验证配置

配置完成后，需要验证一下：

1. **登录测试**：登录OpenList，正常使用一段时间，看是否还会被踢出
2. **IP检查**：在OpenList的日志中查看记录的客户端IP是否是真实IP
3. **缓存测试**：用curl测试登录接口，看响应头中是否有缓存相关的头

```bash
# 测试登录接口是否被缓存
curl -I https://files.example.com/api/auth/login

# 应该看到这些头：
# Cache-Control: no-cache, no-store, must-revalidate
# 或者没有缓存相关的头
```

# 七、其他注意事项

## 7.1 EdgeOne的WebSocket支持

如果你用到OpenList的WebSocket功能（比如实时文件监控），需要在EdgeOne中开启WebSocket支持。

## 7.2 大文件上传

EdgeOne对大文件上传有限制，如果需要上传大文件，建议：

- 在EdgeOne配置中调大上传文件大小限制
- 或者对上传接口单独配置，绕过EdgeOne直接访问源站

## 7.3 日志排查

如果还有问题，可以查看两边的日志：

- EdgeOne：控制台 -> 日志服务 -> 实时日志
- OpenList：服务器上的日志文件，通常在`data/log/`目录下

对比两边的日志，看请求在EdgeOne层面和OpenList层面分别发生了什么。

# 八、总结

OpenList接入EdgeOne国内版，主要需要注意：

1. **缓存配置**：确保API和认证接口不被缓存
2. **IP传递**：配置OpenList从代理头获取真实IP
3. **时间同步**：确保服务器时间正确
4. **token有效期**：根据需要调整，不要太短也不要太长

配置正确后，EdgeOne确实能显著提升国内用户的访问速度。token失效问题的根源基本都是缓存和IP绑定，解决这两个点就没什么问题了。

折腾了一下午，总算搞定了。现在登录状态稳定，访问速度也快了不少，值得。