// NOTE: embed.js is deprecated and only exists for compatibility reasons.
// Please use a direct <iframe> of embed.html instead!

(function() {
  'use strict';

  // compatibility: embed.js does not work in some common WYSIWYG editors
  // security: this script could potentially do things like steal browser cookies. an <iframe> should not be able to do this ("same origin policy")
  // embed.js won't be removed soon but it may be removed "eventually" and is not actively tested
  console.warn('forkphorus: embed.js is deprecated due to compatibility and security concerns and may stop working in the future. Please use a direct <iframe> of embed.html instead! The generator on https://forkphorus.github.io/ has been updated to do this.');

  // Get this script's HTML element.
  // We'll replace the script element with the frame.
  var script = document.currentScript || (function(scripts) {
    return scripts[scripts.length - 1];
  })(document.getElementsByTagName('script'));

  // Determine the hasUI option to properly size the frame.
  var hasUI = true;
  var baseWidth = 480;
  var baseHeight = 360;
  var params = script.src.split('?')[1].split('&');
  params.forEach(function(p) {
    var parts = p.split('=');
    switch (parts[0]) {
      case 'ui':
        hasUI = parts[1] !== 'false';
        break;
      case 'w':
        baseWidth = +parts[1];
        break;
      case 'h':
        baseHeight = +parts[1];
        break;
    }
  });

  var iframe = document.createElement('iframe');
  iframe.setAttribute('allowfullscreen', true);
  iframe.setAttribute('allowtransparency', true);
  iframe.src = script.src.replace('embed.js', 'embed.html');
  if (hasUI) {
    // include enough for controls and the player border
    iframe.width = baseWidth + 2;
    iframe.height = baseHeight + 33;
  } else {
    iframe.width = baseWidth;
    iframe.height = baseHeight;
  }
  iframe.style.border = '0';
  iframe.className = 'forkphorus-embed';

  script.parentNode.replaceChild(iframe, script);

}());
