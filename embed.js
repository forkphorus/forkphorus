// NOTE: embed.js is deprecated and only exists for compatibility reasons.
// Please use a direct <iframe> of embed.html instead!

(function() {
  'use strict';

  // Compatibility: The embed.js <script> tag does not work in some common WYSIWYG website designers.
  // Security: The <script> tag full access to the website it is embedded in while an <iframe> is sandboxed. There has also been some known security vulnerabilities that the iframe is immune from.
  console.warn('forkphorus: embed.js is deprecated due to compatibility and security concerns and may stop working in the future. Please use a direct <iframe> of embed.html instead! The generator on https://forkphorus.github.io/ has been updated to do this.');

  // Get this script's HTML element.
  // We'll replace the script element with the frame.
  var script = document.currentScript;

  // Named elements can override document.currentScript. Because we generate the iframe's source from the
  // script's source, blindly using the source from that named element would be a security bug.
  if (script.tagName.toUpperCase() !== 'SCRIPT') {
    throw new Error('forkphorus: document.currentScript is not a script. This indicates a DOM clobbering attack. Refusing to continue for security.');
  }

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

  // Rewrite embed.js to embed.html
  var iframeSrc = new URL(script.src);
  if (!iframeSrc.pathname.endsWith('/embed.js')) {
    throw new Error('forkphorus: embed script is not named embed.js. Unable to safely generate <iframe> src. Refusing to continue for security.');
  }
  iframeSrc.pathname = iframeSrc.pathname.replace(/\/embed\.js$/, '/embed.html');
  iframe.src = iframeSrc.href;

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
