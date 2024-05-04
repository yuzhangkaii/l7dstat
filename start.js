const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// 确保请求的文件路径安全，不包含'..'等越权访问字符
function isPathSafe(reqPath) {
    const resolvedPath = path.resolve('./', reqPath);
    return resolvedPath.startsWith(path.resolve('./'));
}

// 处理GET请求的通用函数
function handleRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const filePath = decodeURIComponent(parsedUrl.pathname).substring(1); // 移除URL开头的'/'

    // 确保请求路径安全且指向的是.txt文件
    if (isPathSafe(filePath) && path.extname(filePath) === '.txt') {
        const fullFilePath = path.join(process.cwd(), filePath);

        fs.readFile(fullFilePath, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('File not found.');
            } else {
                res.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
                res.end(data);
            }
        });
    } else {
        res.writeHead(403);
        res.end('Access denied or invalid file type.');
    }
}

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    if (req.method === 'GET') {
        handleRequest(req, res);
    } else {
        res.writeHead(405); // Method Not Allowed
        res.end('Only GET method is allowed.');
    }
});

// 启动服务器，监听2005端口
const port = 2005;
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
    console.log('Note: The server has been modified to disallow requests that attempt to access files outside the designated folders.');
});
