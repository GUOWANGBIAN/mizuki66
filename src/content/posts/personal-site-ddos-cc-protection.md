---
title: 个人站长防DDoS和CC攻击实战指南
published: 2026-03-28
description: '小站长如何低成本防护DDoS和CC攻击，避免服务器被打瘫'
image: ''
tags: [服务器, 安全, DDoS, CC攻击]
category: '技术折腾'
draft: false
lang: ''
---

做个人站最怕什么？辛辛苦苦搭起来的站，突然被打瘫了。

DDoS和CC攻击对小站长来说简直是噩梦——大厂有专门的安全团队和无限带宽，我们小站长预算有限，真被打的时候往往束手无策。

但其实，只要做好防护，大多数攻击都能扛过去。今天聊聊个人站长怎么防DDoS和CC。

# 一、先搞清楚这两种攻击

## DDoS攻击

DDoS（分布式拒绝服务攻击）的原理很简单：用大量的垃圾流量把你的服务器带宽打满，正常用户就访问不了了。

```
正常流量：|---> 服务器
攻击流量：|---> 服务器
          |---> 服务器
          |---> 服务器
          ...（成千上万的请求）
```

DDoS的特点：
- 流量大，动辄几个G甚至几十G
- 打的是带宽和网络层
- 攻击成本低，防护成本高
- 小站长基本扛不住纯流量攻击

## CC攻击

CC（Challenge Collapsar）攻击是DDoS的一种变种，但它打的是应用层。

CC攻击不追求大流量，而是用大量的HTTP请求把你的服务器资源（CPU、内存、数据库连接）耗尽。

```
正常用户：访问页面 -> 服务器返回页面
CC攻击：每秒几百个请求 -> 服务器处理不过来 -> 网站卡死
```

CC的特点：
- 流量不一定大，可能只有几百Kbps
- 打的是服务器性能
- 更难防护，因为看起来像正常请求
- 小站长反而更容易中招

# 二、免费防护方案

## 2.1 Cloudflare（首选）

Cloudflare是小站长的救星，免费版就能防住大部分攻击。

**接入方法**：
1. 注册Cloudflare账号
2. 添加你的域名
3. 修改域名的NS记录指向Cloudflare
4. 开启代理模式（橙色云朵）

**免费版能防什么**：
- 基础的DDoS防护（网络层和应用层）
- 基本的WAF（Web应用防火墙）
- Bot管理（基础版）
- 5分钟内的DDoS攻击自动缓解

**配置建议**：

```
安全级别：高
浏览器完整性检查：开启
挑战通过时间：30分钟
安全模式：I'm Under Attack!（被打时开启）
```

**实战经验**：
- 被打时开启"I'm Under Attack!"模式，会有一个5秒的JavaScript验证
- 配置防火墙规则，拦截异常国家/地区的访问
- 开启Rate Limiting，限制单IP的请求频率

## 2.2 阿里云/腾讯云CDN

国内站长可以用阿里云或腾讯云的CDN，免费版也有基础防护。

**阿里云CDN免费版**：
- 5Gbps的DDoS防护
- 基础的CC防护
- 每月100GB流量

**腾讯云CDN免费版**：
- 2Gbps的DDoS防护
- 基础的CC防护
- 每月10GB流量

**配置要点**：
- 开启IP访问限频
- 配置CC防护阈值
- 启用UA黑/白名单

## 2.3 宝塔面板防护

如果你用宝塔面板，它自带一些防护功能：

```
1. 安装"Nginx防火墙"插件
2. 配置CC防护规则
3. 设置IP黑名单
4. 开启访问频率限制
```

Nginx配置示例：

```nginx
# 限制单IP连接数
limit_conn_zone $binary_remote_addr zone=addr:10m;

# 限制请求频率
limit_req_zone $binary_remote_addr zone=one:10m rate=10r/s;

server {
    # 每个IP最多10个连接
    limit_conn addr 10;
    
    # 每秒最多10个请求，允许突发20个
    limit_req zone=one burst=20 nodelay;
    
    # 超出限制返回503
    limit_req_status 503;
    limit_conn_status 503;
}
```

# 三、低成本付费防护

## 3.1 Cloudflare Pro（$20/月）

如果免费版不够用，可以升级到Pro版：
- 更强的WAF规则
- 更精细的DDoS防护
- 图片优化和缓存
- 每月$20，对小站长来说性价比很高

## 3.2 高防CDN

国内的高防CDN服务，价格比高防IP便宜很多：

- **阿里云DDoS高防**：按量计费，基础防护免费
- **腾讯云大禹**：有免费的基础防护
- **百度云加速**：免费版有5Gbps防护

## 3.3 高防IP

如果攻击流量很大，可能需要上高防IP：

- **阿里云高防IP**：30Gbps起步，月费几千
- **腾讯云高防IP**：类似价格
- **第三方高防**：价格更便宜，但稳定性差一些

对于个人站长，除非业务很重要，否则不建议上高防IP，成本太高。

# 四、服务器层面的防护

## 4.1 系统加固

```bash
# 更新系统
apt update && apt upgrade -y

# 安装fail2ban防暴力破解
apt install fail2ban -y

# 配置fail2ban
cat > /etc/fail2ban/jail.local << EOF
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
bantime = 3600
EOF

# 启动fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

## 4.2 内核参数优化

```bash
# 编辑sysctl.conf
cat >> /etc/sysctl.conf << EOF

# 防SYN Flood
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 4096
net.ipv4.tcp_synack_retries = 2

# 防止TIME_WAIT过多
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 30

# 增大连接数
net.core.somaxconn = 4096
net.core.netdev_max_backlog = 4096

# 忽略ICMP（可选）
net.ipv4.icmp_echo_ignore_all = 1
EOF

# 应用配置
sysctl -p
```

## 4.3 防火墙配置

```bash
# 使用iptables限制连接数
iptables -A INPUT -p tcp --dport 80 -m connlimit --connlimit-above 50 -j DROP
iptables -A INPUT -p tcp --dport 443 -m connlimit --connlimit-above 50 -j DROP

# 限制单IP每秒连接数
iptables -A INPUT -p tcp --dport 80 -m limit --limit 100/minute --limit-burst 200 -j ACCEPT
iptables -A INPUT -p tcp --dport 80 -j DROP

# 保存规则
iptables-save > /etc/iptables.rules
```

## 4.4 Nginx防护配置

```nginx
# 限制请求体大小
client_max_body_size 10m;

# 超时设置
client_body_timeout 10s;
client_header_timeout 10s;
send_timeout 10s;
keepalive_timeout 65s;

# 屏蔽异常User-Agent
if ($http_user_agent ~* "python|curl|wget|httpclient|okhttp") {
    return 403;
}

# 屏蔽空Referer（根据业务需要）
if ($http_referer = "") {
    return 403;
}

# 限制单IP并发连接数
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;
limit_conn conn_limit 50;

# 限制请求频率
limit_req_zone $binary_remote_addr zone=req_limit:10m rate=20r/s;
limit_req req_limit burst=50 nodelay;
```

# 五、应用层面的防护

## 5.1 启用缓存

缓存是最有效的CC防护手段，能大幅减少服务器压力：

```nginx
# Nginx缓存配置
proxy_cache_path /tmp/nginx_cache levels=1:2 keys_zone=my_cache:10m inactive=60m;

server {
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2)$ {
        proxy_cache my_cache;
        proxy_cache_valid 200 302 10m;
        proxy_cache_valid 404 1m;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

## 5.2 数据库优化

CC攻击经常把数据库打满，优化数据库能提高抗压能力：

```sql
-- 开启查询缓存
SET GLOBAL query_cache_size = 67108864;
SET GLOBAL query_cache_type = 1;

-- 优化慢查询
SET GLOBAL slow_query_log = 1;
SET GLOBAL long_query_time = 1;

-- 限制连接数
SET GLOBAL max_connections = 200;
```

## 5.3 PHP防护配置

```ini
; php.ini 优化

; 限制脚本执行时间
max_execution_time = 30

; 限制内存使用
memory_limit = 128M

; 限制POST大小
post_max_size = 10M

; 限制上传大小
upload_max_filesize = 5M
```

# 六、监控和应急

## 6.1 监控工具

```bash
# 安装iftop查看流量
apt install iftop -y
iftop -i eth0

# 安装htop查看资源
apt install htop -y
htop

# 查看连接数
netstat -an | grep :80 | wc -l

# 查看当前连接
netstat -an | grep :80 | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn | head -20
```

## 6.2 应急响应流程

1. **确认攻击**：查看流量和连接数是否异常
2. **开启防护**：开启Cloudflare的"I'm Under Attack!"模式
3. **限制访问**：临时封禁异常IP段
4. **联系服务商**：如果扛不住，联系服务器商开启高防
5. **保持冷静**：大多数攻击不会持续太久

## 6.3 自动化脚本

```bash
#!/bin/bash
# 自动封禁异常IP脚本

# 统计单IP连接数
netstat -an | grep :80 | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn | while read count ip; do
    if [ $count -gt 100 ]; then
        # 连接数超过100的IP自动封禁
        iptables -A INPUT -s $ip -j DROP
        echo "$(date): Blocked $ip with $count connections" >> /var/log/blocked_ips.log
    fi
done
```

# 七、成本对比

| 防护方案 | 月成本 | 防护能力 | 适用场景 |
|---------|--------|---------|---------|
| Cloudflare免费 | 0 | 基础DDoS+CC | 大多数个人站 |
| Cloudflare Pro | $20 | 较强DDoS+CC | 流量较大的站 |
| 阿里云CDN免费 | 0 | 基础防护 | 国内站 |
| 高防CDN | 几百元 | 中等防护 | 被频繁攻击 |
| 高防IP | 几千元 | 强力防护 | 业务重要 |

# 八、总结

个人站长防DDoS和CC攻击，核心思路是：

1. **用好免费资源**：Cloudflare免费版能防住大多数攻击
2. **做好基础防护**：系统加固、防火墙配置、Nginx优化
3. **启用缓存**：缓存是最有效的CC防护
4. **监控预警**：及时发现异常，快速响应
5. **量力而行**：小站长没必要上高防，成本太高

说到底，大多数攻击都是试探性的，做好基础防护就能扛住。真遇到大流量攻击，该用高防就用高防，该换IP就换IP，别硬扛。

服务器安全是个持续的过程，不是配一次就完事了。定期检查、及时更新、做好备份，才能把风险降到最低。