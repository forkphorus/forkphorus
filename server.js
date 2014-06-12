var fs = require('fs');
var http = require('http');
var url = require('url');
var querystring = require('querystring');

var MIME_TYPES = {
  html: 'text/html',
  js: 'application/javascript',
  css: 'text/css',
  svg: 'image/svg+xml'
};

http.createServer(function(req, res) {

  var u = url.parse(req.url);

  if (u.pathname === '/') {
    u.pathname = '/index.html';
  }

  fs.readFile(__dirname + u.pathname, function(err, data) {
    if (err || !data) {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[u.pathname.split('.').pop()] || 'text/plain'
    });
    return res.end(data);
  });

}).listen(process.env.PORT || 8080, process.env.HOST);
