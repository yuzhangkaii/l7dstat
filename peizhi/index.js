const http = require("http");
const fs = require("fs");
const WebSocket = require("ws");
const cluster = require("cluster");
const os = require("os");
const cpus = os.cpus().length;
const port = peiport;
const index = fs.readFileSync("./index.html");
const path = require('path');
const url = require('url');

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


function parseLogFile(callback) {
  fs.readFile("log.txt", "utf-8", (err, data) => {
    if (err) return console.error(err);
    const lines = data.split("\n").filter(line => line.trim() !== '');
    const currentTime = new Date();
    const targetMinute = currentTime.getMinutes(); // 获取当前分钟

    const requestsByMinuteAndSecond = {};
    lines.forEach(line => {
      const regex = /"([^"]+)"\s+(\S+)\s+(\S+)/; // 匹配日期时间、IP地址和请求内容
      const match = line.trim().match(regex);
      if (match) {
        const timeStr = match[1]; // 提取日期时间字符串
        const requestTime = new Date(timeStr);

        const logMinute = requestTime.getMinutes();
        const logSeconds = requestTime.getSeconds();
        const logTimeInSeconds = logMinute * 60 + logSeconds; // 把时间转换为秒数

        const currentTimeInSeconds = targetMinute * 60 + currentTime.getSeconds(); // 当前时间的秒数

        const timeDifference = currentTimeInSeconds - logTimeInSeconds;
        if (timeDifference <= 10 && timeDifference >= 0) { // 判断是否在3秒内
          const targetKey = `${logMinute}:${logSeconds - 10}`;
          if (requestsByMinuteAndSecond[targetKey]) {
            requestsByMinuteAndSecond[targetKey]++;
          } else {
            requestsByMinuteAndSecond[targetKey] = 1;
          }
        }
      }
    });

    // 转换为数组，包括秒数和对应的请求数
    const requestData = Object.entries(requestsByMinuteAndSecond).map(([timeKey, requestCount]) => {
      return { timeKey, requestCount };
    });

    callback(requestData); // 返回每个时间点的请求计数及总请求数
  });
}

if (cluster.isMaster) {
  console.log(`Number of CPUs is ${cpus}`);
  console.log(`Master ${process.pid} is running`);

  let requests = 0;
  let childs = [];
  for (let i = 0; i < cpus; i++) {
    let child = cluster.fork();
    child.on("message", (msg) => {
      requests += msg.reduce((acc, val) => acc + val, 0); // 累加各秒的请求数
    });
    childs.push(child);
  }

  setInterval(() => {
    parseLogFile((requestsPerSecond) => {
      for (let child of childs) {
        child.send(requestsPerSecond);
      }
    }, 3); // 时间差为3秒
    requests = 0;
  }, 1000);
} else {
  console.log(`Worker ${process.pid} started`);

  const handler = function (req, res) {
    if (req.url.startsWith("/logs/") || req.url.startsWith("/log/")) {
      handleRequest(req, res);
    } else {
      res.end(index);
    }
  };

  const server = http.createServer(handler);
  const wss = new WebSocket.Server({ server });

  
  process.on("message", (requestData) => {
    let totalRequests = 0; // 初始化总请求数

    // 计算总请求数
    requestData.forEach(({ requestCount }) => {
        totalRequests += requestCount;
    });

    // 将总请求数转换为字符串发送给所有连接的客户端
    const totalRequestsStr = totalRequests.toString();
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(totalRequestsStr);
        }
    });
});

  server.listen(port);
}