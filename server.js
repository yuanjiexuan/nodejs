var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var cache = {};
var chatServer = require('./lib/chat_server');
chatServer.listen(server)
// 发送文件数据及错误数据
function send404(response){
    response.writeHead(404,{'Content-Type': 'text/plain'});
    response.write('Error 404: resource not found');
    response.end();
}

// 提供文件数据服务
function sendFile(response, filePath, fileContents){
    response.writeHead(200,{"content-type": mime.lookup(path.basename(filePath))});
    response.end(fileContents)
}
// 提供静态文件服务
function serveStatic(response, cache, absPath){
    // 检查文件是否缓存在内存中
    if(cache[absPath]){
        // 从内存中返回文件
        sendFile(response, absPath,cache[absPath]);
    }else {
        // 检查文件是否存在
        fs.exists(absPath,function (exists) { 
            if(exists) {
                // 从硬盘中读取文件
                fs.readFile(absPath,function (err,data) { 
                    if(err){
                        send404(response);
                    }else {
                        // 从硬盘中读取文件并返回
                        cache[absPath] = data;
                        sendFile(response, absPath, data);
                    }
                 })
            }else {
                // 发送HTTP 404响应
                send404(response)
            }
         })
    }
}
// 创建HTTP服务器的逻辑
var server = http.createServer(function(request, response){
    var filePath = false;
    if(request.url == "/") {
        // 确定返回的默认HTML文件
        filePath = 'public/index.html';
    }else {
        // 将URL路径转为文件的相对路径
        filePath = 'public' + request.url;
    }
    var absPath = './' + filePath;
    // 返回静态文件
    serveStatic(response, cache, absPath);
})

server.listen(3000,function() {
    console.log("Server listening on port 3000.")
})