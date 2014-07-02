(function(global) {
  'use strict';

  var script = document.currentScript || (function(scripts) {
    return scripts[scripts.length - 1];
  })(document.getElementsByTagName('script'));

  var iframe = document.createElement('iframe');
  iframe.setAttribute('allowfullscreen', true);
  iframe.setAttribute('allowtransparency', true);
  iframe.src = script.src.replace(/embed\.js/, 'embed.html') + '&';
  iframe.width = 482;
  iframe.height = 393;
  iframe.style.border = '0';
  iframe.className = 'phosphorus';

  script.parentNode.replaceChild(iframe, script);

}(this));
