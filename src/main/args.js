var ARG_RE = /(.*)=(.*)/;
var args = {};

process.argv.forEach(function (arg) {
  var match = arg.match(ARG_RE);
  if (match) {
    args[match[1]]=match[2];
  }
});

module.exports = args;