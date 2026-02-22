const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// -------------------------- 配置项（改这里） --------------------------
const INDEXNOW_KEY = 'ff275a61484b4a81bf85b2de796fedf4'; // 替换成你的Key
const SITE_DOMAIN = 'https://www.ngstudio.icu'; // 替换成你的域名
const DIST_DIR = path.join(__dirname, '../dist'); // Astro 构建后的 dist 目录
const EXCLUDE_PATHS = ['/404.html', '/favicon.ico', '/robots.txt']; // 排除不需要推送的链接
// ---------------------------------------------------------------------

// 步骤 1：递归读取 dist 目录下所有 HTML 文件
function getAllHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getAllHtmlFiles(filePath, fileList);
    } else if (path.extname(file) === '.html') {
      fileList.push(filePath);
    }
  });
  return fileList;
}

// 步骤 2：提取 HTML 文件对应的 URL 路径
function getUrlList() {
  const htmlFiles = getAllHtmlFiles(DIST_DIR);
  const urlList = [];

  htmlFiles.forEach(filePath => {
    // 把本地路径转成网站 URL 路径（比如 dist/posts/1.html → /posts/1）
    let relativePath = path.relative(DIST_DIR, filePath);
    // 去掉 .html 后缀（Astro 静态构建默认生成 .html，浏览器访问时可省略）
    relativePath = relativePath.replace(/\.html$/, '');
    // 根目录的 index.html → /
    if (relativePath === 'index') relativePath = '';

    const urlPath = `/${relativePath}`;
    // 排除不需要推送的链接
    if (!EXCLUDE_PATHS.includes(urlPath)) {
      const fullUrl = `${SITE_DOMAIN}${urlPath}`;
      urlList.push(fullUrl);
    }
  });

  return urlList;
}

// 步骤 3：批量推送 URL 到 IndexNow
function pushToIndexNow(urlList) {
  if (urlList.length === 0) {
    console.log('❌ 没有可推送的链接');
    return;
  }

  console.log(`✅ 准备推送 ${urlList.length} 个链接：`);
  urlList.forEach(url => console.log(`- ${url}`));

  // IndexNow 支持 POST 批量推送（最多 10000 个）
  const postData = JSON.stringify({
    host: SITE_DOMAIN,
    key: INDEXNOW_KEY,
    keyLocation: `/${INDEXNOW_KEY}.txt`,
    urlList: urlList
  });

  try {
    // 用 curl 发送 POST 请求（服务器一般都有 curl）
    const result = execSync(
      `curl -X POST https://api.indexnow.org/IndexNow \
       -H "Content-Type: application/json" \
       -d '${postData.replace(/'/g, "\\'")}'`,
      { encoding: 'utf8' }
    );
    console.log('\n📤 IndexNow 推送结果：', result);
  } catch (error) {
    console.error('\n❌ 推送失败：', error.message);
  }
}

// 执行主逻辑
const urlList = getUrlList();
pushToIndexNow(urlList);
