(function(global) {
  'use strict';

  var script = document.currentScript || (function(scripts) {
    return scripts[scripts.length - 1];
  })(document.getElementsByTagName('script'));

  var hasUI = true;
  var params = script.src.split('?')[1].split('&');
  params.forEach(function(p) {
    var parts = p.split('=');
    if (parts.length > 1 && parts[0] === 'ui') {
      hasUI = parts[1] !== 'false';
    }
  });

  var iframe = document.createElement('iframe');
  iframe.setAttribute('allowfullscreen', true);
  iframe.setAttribute('allowtransparency', true);
  iframe.src = script.src.replace(/^https:/, 'http:').replace(/embed\.js/, 'embed.html');
  iframe.width = hasUI ? 482 : 480;
  iframe.height = hasUI ? 393 : 360;
  iframe.style.border = '0';
  iframe.className = 'phosphorus';

  script.parentNode.replaceChild(iframe, script);

}(this));
