---
title: 别让你的.git目录裸奔：防止源码泄露的完整方案
published: 2026-03-18
description: '.git目录暴露会导致源码、配置、密钥全部泄露，必须做好防护'
image: ''
tags: [安全, Git, 服务器, 部署]
category: '技术折腾'
draft: false
lang: ''
---

前几天帮朋友看他的网站，随手访问了一下`/.git/`，居然直接返回了200。

这意味着什么？整个网站的源码、提交历史、配置文件，甚至数据库密码和API Key，全部暴露在外。

这事儿挺常见的，很多开发者部署代码的时候直接`git clone`到网站目录，忘了把`.git`目录排除出去。一旦被发现，基本等于把服务器脱光了给人看。

# 一、.git目录泄露的危害

.git目录里存了什么？

```
.git/
├── HEAD              # 当前分支指针
├── config            # 仓库配置（可能有远程仓库地址、用户名密码）
├── index             # 暂存区索引
├── objects/          # 所有对象（代码、文件内容）
├── refs/             # 分支和标签引用
├── logs/             # 引用日志
├── hooks/            # 钩子脚本
└── COMMIT_EDITMSG    # 最近一次提交信息
```

**泄露后攻击者能做什么：**

1. **获取完整源码**：通过`git log`和`git show`可以查看所有历史版本的代码
2. **找到敏感信息**：数据库密码、API密钥、配置文件等
3. **分析业务逻辑**：了解系统架构、接口设计、安全机制
4. **发现未公开漏洞**：查看历史提交，可能发现已修复但未部署的漏洞利用代码
5. **获取开发者信息**：邮箱、用户名等个人信息

**真实案例：**

很多大厂都出过这事儿：
- 某电商平台的.git目录被发现，泄露了内部系统架构
- 某政府网站.git暴露，导致公民信息泄露
- 某游戏公司.git被访问，源码和配置全部流出

# 二、检测是否存在泄露

## 2.1 手动检测

最简单的方法，直接访问：

```
http://your-site.com/.git/HEAD
http://your-site.com/.git/config
http://your-site.com/.git/COMMIT_EDITMSG
```

如果返回200状态码和内容，说明存在泄露。

正常情况下应该返回403或404。

## 2.2 自动化工具

**GitHacker**：

```bash
# 安装
pip install GitHacker

# 使用
githacker --url http://target.com/.git/ --output-folder ./output
```

**git-dumper**：

```bash
# 安装
pip install git-dumper

# 使用
git-dumper http://target.com/.git/ ./output
```

**GitTools**：

```bash
# 克隆工具
git clone https://github.com/internetwache/GitTools.git

# 使用Dumper
./GitTools/Dumper/gitdumper.sh http://target.com/.git/ ./output
```

这些工具可以完整地把.git目录下载下来，然后用`git log`、`git show`等命令查看所有内容。

## 2.3 在线扫描

一些在线工具可以批量检测：
- https://git-hack.com/
- https://gitgraber.com/

# 三、Nginx配置防护

## 3.1 禁止访问.git目录

最直接的方法，在Nginx配置中禁止所有.git相关请求：

```nginx
server {
    listen 80;
    server_name your-site.com;
    root /var/www/html;

    # 禁止访问.git目录
    location ~ /\.git {
        deny all;
        return 404;
    }

    # 禁止访问所有隐藏文件和目录
    location ~ /\. {
        deny all;
        return 404;
    }

    # 其他配置...
}
```

## 3.2 更严格的防护

```nginx
server {
    listen 80;
    server_name your-site.com;
    root /var/www/html;

    # 禁止访问所有隐藏文件（包括.git、.env、.htaccess等）
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # 禁止访问特定敏感文件
    location ~* \.(env|git|svn|htpasswd|htaccess|bak|sql|tar|gz|zip)$ {
        deny all;
        access_log off;
        log_not_found off;
    }

    # 禁止访问敏感目录
    location ~ ^/(config|database|storage|vendor|node_modules)/ {
        deny all;
        access_log off;
        log_not_found off;
    }

    # 其他配置...
}
```

## 3.3 使用正则表达式精确匹配

```nginx
server {
    listen 80;
    server_name your-site.com;
    root /var/www/html;

    # 精确禁止.git目录及其所有子目录和文件
    location ~ ^/\.git(/|$) {
        deny all;
        return 404;
    }

    # 禁止.git相关的其他路径
    location ~ ^/\.git-rewrite(/|$) {
        deny all;
        return 404;
    }

    # 禁止.gitignore文件
    location ~ ^/\.gitignore$ {
        deny all;
        return 404;
    }

    # 其他配置...
}
```

# 四、Apache配置防护

## 4.1 使用.htaccess

在网站根目录创建或编辑`.htaccess`文件：

```apache
# 禁止访问.git目录
<DirectoryMatch "^/\.git/">
    Require all denied
</DirectoryMatch>

# 禁止访问所有隐藏文件
<FilesMatch "^\.">
    Require all denied
</FilesMatch>

# 禁止访问.git目录
RedirectMatch 404 /\.git

# 禁止访问敏感文件
<FilesMatch "\.(env|git|svn|htpasswd|bak|sql|tar|gz|zip)$">
    Require all denied
</FilesMatch>
```

## 4.2 Apache主配置

在Apache主配置文件（httpd.conf）中添加：

```apache
# 禁止访问.git目录
<DirectoryMatch "/\.git/">
    Require all denied
</DirectoryMatch>

# 禁止访问所有隐藏文件
<DirectoryMatch "/\.">
    Require all denied
</DirectoryMatch>

# 或者使用Location指令
<LocationMatch "/\.git">
    Require all denied
</LocationMatch>
```

# 五、服务器层面防护

## 5.1 文件权限设置

```bash
# 修改.git目录权限，只允许特定用户访问
chmod 700 /var/www/html/.git
chown www-data:www-data /var/www/html/.git

# 或者直接删除.git目录（如果不需要在服务器上使用git）
rm -rf /var/www/html/.git
```

## 5.2 符号链接方式

把.git目录移到网站目录外面：

```bash
# 移动.git目录
mv /var/www/html/.git /var/www/.git-repo

# 创建符号链接（如果需要在服务器上使用git）
ln -s /var/www/.git-repo /var/www/html/.git

# 修改Nginx配置，禁止访问符号链接
```

## 5.3 使用软链接限制

```bash
# 创建一个受限的.git目录
mkdir -p /var/www/git-storage
mv /var/www/html/.git /var/www/git-storage/your-site.git

# 设置权限
chmod 750 /var/www/git-storage
chown root:www-data /var/www/git-storage

# 不创建符号链接，服务器上不使用git
```

# 六、部署时的注意事项

## 6.1 使用.gitignore

在项目根目录创建`.gitignore`文件，排除敏感文件：

```
# 环境配置
.env
.env.local
.env.production

# IDE配置
.idea/
.vscode/
*.swp
*.swo

# 系统文件
.DS_Store
Thumbs.db

# 依赖目录
node_modules/
vendor/

# 日志文件
*.log
logs/

# 缓存文件
cache/
temp/

# 数据库文件
*.sql
*.sqlite
*.db

# 配置文件（根据需要）
config.local.php
database.yml
```

## 6.2 部署脚本

使用部署脚本而不是直接git clone：

```bash
#!/bin/bash
# deploy.sh

# 设置变量
REPO_URL="git@github.com:your/repo.git"
DEPLOY_DIR="/var/www/html"
TEMP_DIR="/tmp/deploy-$(date +%s)"

# 克隆到临时目录
git clone --depth 1 $REPO_URL $TEMP_DIR

# 同步文件（排除.git目录）
rsync -av --exclude='.git' --exclude='.env' $TEMP_DIR/ $DEPLOY_DIR/

# 清理临时目录
rm -rf $TEMP_DIR

# 设置权限
chown -R www-data:www-data $DEPLOY_DIR
chmod -R 755 $DEPLOY_DIR
```

## 6.3 使用CI/CD

配置GitHub Actions或GitLab CI进行自动化部署：

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to server
      uses: SamKirkland/FTP-Deploy-Action@4.0.0
      with:
        server: ${{ secrets.FTP_SERVER }}
        username: ${{ secrets.FTP_USERNAME }}
        password: ${{ secrets.FTP_PASSWORD }}
        local-dir: ./
        exclude: |
          **/.git*
          **/.env*
          **/node_modules/**
```

## 6.4 Docker部署

使用Docker可以完全避免.git目录泄露：

```dockerfile
# Dockerfile
FROM node:16-alpine

WORKDIR /app

# 复制package.json（不复制.git）
COPY package*.json ./

RUN npm install

# 复制源码（不复制.git和其他敏感文件）
COPY . .

# 删除可能的敏感文件
RUN rm -rf .git .env .env.local

EXPOSE 3000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3'
services:
  web:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./src:/app/src
    environment:
      - NODE_ENV=production
```

# 七、其他敏感文件保护

除了.git，还有其他敏感文件需要保护：

```nginx
# Nginx完整防护配置

# 禁止访问所有隐藏文件和目录
location ~ /\. {
    deny all;
    access_log off;
    log_not_found off;
}

# 禁止访问备份文件
location ~* \.(bak|backup|old|orig|save|swp|tmp)$ {
    deny all;
    access_log off;
    log_not_found off;
}

# 禁止访问配置文件
location ~* \.(env|config|conf|ini|yml|yaml|json|xml|properties)$ {
    deny all;
    access_log off;
    log_not_found off;
}

# 禁止访问压缩包
location ~* \.(tar|tar\.gz|zip|rar|7z|gz|bz2)$ {
    deny all;
    access_log off;
    log_not_found off;
}

# 禁止访问SQL文件
location ~* \.(sql|sqlite|db|mdb)$ {
    deny all;
    access_log off;
    log_not_found off;
}

# 禁止访问日志文件
location ~* \.(log|logs)$ {
    deny all;
    access_log off;
    log_not_found off;
}

# 禁止访问特定目录
location ~ ^/(config|database|storage|vendor|node_modules|tests|docs)/ {
    deny all;
    access_log off;
    log_not_found off;
}
```

# 八、检测和监控

## 8.1 定期扫描

设置定时任务，定期检测服务器上的.git目录：

```bash
#!/bin/bash
# check-git-leak.sh

WEB_ROOT="/var/www/html"
LOG_FILE="/var/log/git-leak-check.log"

echo "$(date): Starting .git directory check..." >> $LOG_FILE

# 查找所有.git目录
find $WEB_ROOT -name ".git" -type d | while read git_dir; do
    echo "$(date): Found .git directory: $git_dir" >> $LOG_FILE
    
    # 检查是否可访问
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/.git/HEAD")
    
    if [ $response -eq 200 ]; then
        echo "$(date): WARNING: .git directory is accessible!" >> $LOG_FILE
        # 发送告警
        # mail -s "Git Directory Leak Detected" admin@example.com < $LOG_FILE
    fi
done

echo "$(date): Check completed." >> $LOG_FILE
```

## 8.2 日志监控

监控Nginx访问日志，检测.git相关请求：

```bash
# 实时监控.git相关请求
tail -f /var/log/nginx/access.log | grep -E "\.git|\.env|\.svn"

# 统计.git请求来源
awk '$7 ~ /\.git/ {print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn

# 封禁频繁访问.git的IP
awk '$7 ~ /\.git/ {print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | awk '$1 > 10 {print $2}' | while read ip; do
    iptables -A INPUT -s $ip -j DROP
    echo "Blocked IP: $ip"
done
```

# 九、总结

防止.git目录泄露，核心就几点：

1. **Web服务器配置**：Nginx/Apache禁止访问.git目录和所有隐藏文件
2. **文件权限**：限制.git目录的访问权限
3. **部署流程**：使用部署脚本而不是直接git clone
4. **定期检测**：扫描服务器，确认没有泄露

最简单有效的方案就是在Nginx配置里加几行：

```nginx
location ~ /\. {
    deny all;
    return 404;
}
```

这一招就能防住99%的.git泄露问题。

安全无小事，别等出事了才想起来补救。部署的时候多花几分钟配置一下，能省去很多麻烦。

毕竟，谁也不想自己的源码和配置被人扒光了看。