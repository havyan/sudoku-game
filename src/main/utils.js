var RE_IPV4 = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
var RE_IPV6 = /^[\w:]+$/;
var RE_IPV64 = /^[\w:]+:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/;

var getIp = function(ip) {
  var match;
  ip = ip.trim();
  if (ip.match(RE_IPV4) || ip.match(RE_IPV6)) {
    return ip;
  } else if (match = ip.match(RE_IPV64)) {
    return match[1];
  } else {
    return ip;
  }
};

var clientIp = function(req) {
  return getIp(req.headers['X-Real-IP'] || req.ip);
}

module.exports = {
  clientIp: clientIp
}
