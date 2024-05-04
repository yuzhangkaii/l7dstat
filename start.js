//------------------------------------------------ 
// 利用nodejs搭建一个简单的Web服务器 
//------------------------------------------------ 

//启动计时器，记录启动服务所花费的时间
console.time('start WebServer need time');

//请求模块 
var libHttp = require('http');  //HTTP协议模块 
var libUrl = require('url');    //URL解析模块 
var libFs = require("fs");      //文件系统模块 
var libPath = require("path");  //路径解析模块 

//依据路径获取返回内容类型字符串,用于http响应头 
var funGetContentType = function (filePath) {
    var contentType = "";
    
    //使用路径解析模块获取文件扩展名 
    var ext = libPath.extname(filePath);
    
    switch (ext) {
        case ".html":
            contentType = "text/html";
            break;
        case ".js":
            contentType = "text/javascript";
            break;
        case ".json":
            contentType = "text/json";
            break;
        case ".css":
            contentType = "text/css";
            break;
        case ".gif":
            contentType = "image/gif";
            break;
        case ".jpg":
            contentType = "image/jpeg";
            break;
        case ".png":
            contentType = "image/png";
            break;
        case ".ico":
            contentType = "image/icon";
            break;
        default:
            contentType = "application/octet-stream";
    }
    
    //返回内容类型字符串 
    return contentType;
}

//Web服务器主函数,解析请求,返回Web内容 
var funWebSvr = function (req, res) {
    //获取请求的url 
    var reqUrl = req.url;
    
    //向控制台输出请求的路径 
    console.log(reqUrl);
    
    //使用url解析模块获取url中的路径名 
    var pathName = libUrl.parse(reqUrl).pathname;    
    if (libPath.extname(pathName) == "") {
        //如果路径没有扩展名 
        pathName += "/"; //指定访问目录 
    }
    if (pathName.charAt(pathName.length - 1) == "/") {
        //如果访问目录 
        pathName += "index.html"; //指定为默认网页 
    }
    
    //使用路径解析模块,组装实际文件路径 
    var filePath = libPath.join("./", pathName);

    //判断文件是否存在 
    libFs.exists(filePath, function (exists) {
        //文件存在
        if (exists) {
            //在响应头中写入内容类型 
            res.writeHead(200, { "Content-Type": funGetContentType(filePath) });
            
            //创建只读流用于返回 
            var stream = libFs.createReadStream(filePath, { flags: "r", encoding: null });
            
            //指定如果流读取错误,返回404错误 
            stream.on("error", function () {
                res.writeHead(404);
                res.end("<h1>404 Read Error</h1>");
            });
            
            //连接文件流和http返回流的管道,用于返回实际Web内容 
            stream.pipe(res);
        }
        else {
            //文件不存在，返回404错误 
            res.writeHead(404, { "Content-Type": "text/html" });
            res.end("<h1>404 Not Found</h1>");
        }
    });
}

//创建一个http服务器 
var webSvr = libHttp.createServer(funWebSvr);

//指定服务器错误事件响应 
webSvr.on("error", function (error) {
    //在控制台中输出错误信息 
    console.log(error); 
});

//开始侦听8080端口 
webSvr.listen(2005, function () {
    //向控制台输出服务启动的信息 
    console.log('WebServer running at http://127.0.0.1:8080/');
    
    //关闭服务启动计时器
    console.timeEnd('start WebServer need time');
});
