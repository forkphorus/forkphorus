var fs = require('fs');
var http = require('http');
var url = require('url');
var exec = require('child_process').exec;

var id = +process.argv[2];
var max = +process.argv[3] || 0;
if (!id) {
  console.error('Usage: node test-add <id> [max-frames]');
  process.exit(1);
}

http.createServer(function(req, res) {
  var u = url.parse(req.url);
  if (u.pathname === '/' || u.pathname === '/test-capture.swf') {
    fs.readFile(__dirname + '/' + (u.pathname.slice(1) || 'test-capture.html'), function(err, data) {
      if (err || !data) {
        res.writeHead(500);
        return res.end();
      }
      res.writeHead(200, {
        'Content-Type': 'text/html'
      });
      return res.end(data);
    });
  } else if (u.pathname === '/test-add') {
    var data = '';
    req.on('data', function(b) {
      data += b;
    });
    req.on('end', function() {
      fs.writeFile('test/' + id + '.json', data, function(err) {
        if (err) throw err;
        res.end();
        process.exit(0);
      });
    });
  }
}).listen(9007, '0.0.0.0');

exec('open http://localhost:9007/?id=' + id + '&max=' + max);
