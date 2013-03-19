// TODO: support message type
// TODO: support Last-Event-ID

exports.send = function(data, fn) {
  var lines = data.split('\n');
  var sendData = "";
  for (var i in lines)
    sendData += "data: " + lines[i] + '\n';
  sendData += '\n';
  fn(sendData);
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
