(function() {
  'use strict';

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
