// TODO: support message type
// TODO: support Last-Event-ID


exports.stringify = function(data) {
  var lines = data.split('\n');
  var sendData = "";
  for (var i in lines)
    sendData += "data: " + lines[i] + '\n';
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
  for (var i in lines) {
    var line = lines[i];
    if (line.startsWith('data: ')) {
      if (!first)
        data += '\n';
      first = false;
      data += line.substr(6);
    }
  }
  return data;
}
