---
title: 云服务器搭建SRS流媒体服务器，单路拉流同时推送到四个直播平台
published: 2026-04-25
description: '记录在云服务器上搭建SRS流媒体服务器，实现单通道拉流后同时向B站、抖音、快手、视频号四个平台推流的全过程'
image: ''
tags: [服务器运维, 直播技术]
category: '服务器建站'
draft: false
lang: ''
---

最近有个需求：用一台云服务器做中转，从一个拉流地址获取直播流，然后同时推送到B站、抖音、快手、斗鱼四个直播平台。这样只需要一路推流上行，就能实现多平台同时直播，节省带宽和设备资源。折腾了两天终于搞定了，记录一下整个过程。

# 一、方案选型

## 1.1 为什么选SRS

对比了几个流媒体服务器方案：

| 方案 | 优点 | 缺点 |
|------|------|------|
| SRS | 开源免费、功能完善、文档齐全、社区活跃 | 配置项较多 |
| Nginx-RTMP | 轻量、配置简单 | 功能有限、已停止维护 |
| MediaMTX | 现代化、支持协议多 | 社区较小 |
| 哔哩哔哩直播组件 | 针对B站优化 | 只支持B站 |

最终选择SRS（Simple Realtime Server），主要是因为：

- 开源免费，GitHub上star数很高
- 支持RTMP、HLS、HTTP-FLV、WebRTC等多种协议
- 可以实现一路输入多路输出（relay）
- 文档完善，国内用户多，遇到问题好排查

## 1.2 服务器配置

服务器由[雨云](https://www.rainyun.com/qhgsf_)提供，配置如下：

- CPU：4核
- 内存：4GB
- 带宽：100Mbps（这个很关键，推四路流需要足够带宽）
- 系统：Ubuntu 22.04 LTS

**带宽计算：** 一路1080p直播流大约需要4-6Mbps，四路推流就是16-24Mbps，加上拉流和系统开销，30Mbps基本够用。如果推的是720p流，带宽要求会低很多。

# 二、SRS安装部署

## 2.1 Docker方式安装（推荐）

最简单的方式是用Docker部署：

```bash
# 拉取SRS镜像
docker pull ossrs/srs:5

# 创建配置文件目录
mkdir -p /opt/srs/conf

# 启动SRS容器
docker run -d \
  --name srs \
  --restart=always \
  -p 1935:1935 \
  -p 1985:1985 \
  -p 8080:8080 \
  -v /opt/srs/conf:/usr/local/srs/conf \
  ossrs/srs:5
```

## 2.2 编译安装

如果需要更多自定义选项，可以编译安装：

```bash
# 克隆源码
git clone -b 5.0release https://github.com/ossrs/srs.git
cd srs/trunk

# 编译
./configure && make

# 启动
./objs/srs -c conf/srs.conf
```

# 三、核心配置：单路拉流 + 四路推流

这是整个方案的核心。SRS的配置文件位于`/opt/srs/conf/srs.conf`，完整的配置如下：

```nginx
listen              1935;
max_connections     1000;
daemon              off;
srs_log_tank        console;

http_server {
    enabled         on;
    listen          8080;
    dir             ./objs/nginx/html;
}

# 拉流配置：从源地址拉取直播流
ingest __defaultVhost__ {
    enabled      on;
    input {
        type     stream;
        url      "rtmp://源服务器地址/live/stream_key";
    }
    ffmpeg       ./objs/ffmpeg/bin/ffmpeg;
    engine {
        enabled          on;
        output          rtmp://127.0.0.1/live/source;
        vcodec          copy;
        acodec          copy;
    }
}

# 推流到B站
vhost __defaultVhost__ {
    # 原始流
    hls {
        enabled         on;
        hls_fragment    2;
        hls_window      10;
        hls_path        ./objs/nginx/html;
        hls_m3u8_file   [app]/[stream].m3u8;
        hls_ts_file     [app]/[stream]-[seq].ts;
    }
}

# 使用FFmpeg进行多路转推
# 这部分通过外部脚本实现，更灵活
```

对于多平台推流，我用FFmpeg配合SRS来实现。写一个推流脚本：

```bash
#!/bin/bash
# push_multi.sh - 单路拉流，多平台推流

# 源流地址（从SRS拉取本地流）
SOURCE="rtmp://127.0.0.1/live/source"

# 各平台推流地址（替换为你的实际推流地址）
BILI_RTMP="rtmp://live-push.bilivideo.com/live-bvc/?streamname=你的B站推流码&key=你的密钥"
DOUYIN_RTMP="rtmp://push-rtmp.douyin.com/live/你的抖音推流码"
KUAISHOU_RTMP="rtmp://push.kuaishou.com/live/你的快手推流码"
DOUYU_RTMP="rtmp://send2.douyu.com/live/你的斗鱼推流码"

# 启动四路推流
nohup ffmpeg -re -i "$SOURCE" \
  -c:v copy -c:a copy \
  -f flv "$BILI_RTMP" \
  > /var/log/ffmpeg_bili.log 2>&1 &

nohup ffmpeg -re -i "$SOURCE" \
  -c:v copy -c:a copy \
  -f flv "$DOUYIN_RTMP" \
  > /var/log/ffmpeg_douyin.log 2>&1 &

nohup ffmpeg -re -i "$SOURCE" \
  -c:v copy -c:a copy \
  -f flv "$KUAISHOU_RTMP" \
  > /var/log/ffmpeg_kuaishou.log 2>&1 &

nohup ffmpeg -re -i "$SOURCE" \
  -c:v copy -c:a copy \
  -f flv "$DOUYU_RTMP" \
  > /var/log/ffmpeg_douyu.log 2>&1 &

echo "四路推流已启动"
echo "B站PID: $(jobs -p | sed -n '1p')"
echo "抖音PID: $(jobs -p | sed -n '2p')"
echo "快手PID: $(jobs -p | sed -n '3p')"
echo "斗鱼PID: $(jobs -p | sed -n '4p')"
```

# 四、进程守护

推流脚本需要长期稳定运行，使用systemd进行进程管理：

```ini
# /etc/systemd/system/srs-push.service
[Unit]
Description=SRS Multi-Platform Push Service
After=network.target docker.service

[Service]
Type=forking
ExecStart=/opt/srs/push_multi.sh
ExecStop=/usr/bin/pkill -f "ffmpeg.*rtmp"
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# 启用并启动服务
sudo systemctl daemon-reload
sudo systemctl enable srs-push
sudo systemctl start srs-push

# 查看状态
sudo systemctl status srs-push
```

# 五、监控和日志

## 5.1 SRS控制台

SRS自带了一个Web控制台，访问 `http://你的服务器IP:1985` 可以查看：

- 当前连接数
- 推拉流状态
- 带宽使用情况

## 5.2 FFmpeg日志监控

```bash
# 查看各平台推流日志
tail -f /var/log/ffmpeg_bili.log
tail -f /var/log/ffmpeg_douyin.log
tail -f /var/log/ffmpeg_kuaishou.log
tail -f /var/log/ffmpeg_douyu.log

# 检查FFmpeg进程是否存活
ps aux | grep ffmpeg
```

## 5.3 自动重连脚本

网络抖动可能导致推流断开，写一个守护脚本定期检查并自动重连：

```bash
#!/bin/bash
# watchdog.sh - 推流进程守护

while true; do
    # 检查FFmpeg进程数
    FFMPEG_COUNT=$(ps aux | grep "ffmpeg.*rtmp" | grep -v grep | wc -l)

    if [ $FFMPEG_COUNT -lt 4 ]; then
        echo "[$(date)] 检测到推流进程异常，当前数量: $FFMPEG_COUNT，重启中..."
        pkill -f "ffmpeg.*rtmp"
        sleep 2
        /opt/srs/push_multi.sh
        echo "[$(date)] 推流已重启"
    fi

    sleep 30
done
```

# 六、踩坑记录

## 6.1 带宽不够

一开始用的是10Mbps的服务器，推四路1080p直接卡死。解决办法：

- 降低推流码率（从4000kbps降到2000kbps）
- 或者升级服务器带宽
- 推720p流也是个办法，大部分直播平台720p就够了

## 6.2 FFmpeg内存泄漏

长时间运行FFmpeg可能会有内存泄漏，建议：

- 定期重启推流服务（通过cron每天凌晨重启一次）
- 监控内存使用情况

## 6.3 各平台推流码配置不同

不同平台的推流地址格式不一样，有的需要额外参数：

```bash
# B站需要设置码率
BILI_RTMP="rtmp://live-push.bilivideo.com/live-bvc/?streamname=xxx&key=xxx&video_br=2000"

# 抖音需要特殊的推流地址格式
DOUYIN_RTMP="rtmp://push-rtmp.douyin.com/live/xxx-xxx-xxx"
```

## 6.4 防火墙配置

确保服务器防火墙放行了相关端口：

```bash
# 放行RTMP端口
sudo ufw allow 1935

# 放行HTTP端口（用于Web控制台）
sudo ufw allow 8080
sudo ufw allow 1985
```

# 七、总结

通过SRS + FFmpeg的方案，我实现了单路拉流、四路推流的多平台直播中转。整个方案的核心优势：

1. **节省上行带宽：** 只需要一路推流到服务器，服务器负责分发
2. **降低成本：** 不需要在每个平台都单独推流
3. **集中管理：** 所有推流逻辑集中在一台服务器上，方便监控和维护
4. **灵活扩展：** 要增加新的直播平台，只需要在脚本里加一行推流地址

如果你也有类似的需求，这套方案值得一试。SRS的文档写得很详细，遇到问题可以在GitHub上提issue，社区响应也挺快的。
