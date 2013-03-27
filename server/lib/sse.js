// TODO: support message type
// TODO: support Last-Event-ID


exports.stringify = function(data) {
  var lines = data.split('\n');
  var sendData = '';
  lines.forEach(function(line) {
    sendData += 'data: ' + line + '\n';
  });
  sendData += '\n';
  return sendData;
};

exports.send = function(data, fn) {
  fn(exports.stringify(data));
}

// for test only
exports.parse = function(str) {
  var lines = str.split('\n');
  var data = "";
  var first = true;
  lines.forEach(function(line) {
    if (line.startsWith('data: ')) {
      if (!first)
        data += '\n';
      first = false;
      data += line.substr(6);
    }
  });
  return data;
}
