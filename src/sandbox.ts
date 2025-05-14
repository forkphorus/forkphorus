/// <reference path="phosphorus.ts" />

namespace P.sandbox {
  let iframe: HTMLIFrameElement | null = null;

  export const getSandbox = (): HTMLElement => {
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.className = 'forkphorus-sandbox';

      // iframe must be same-origin so we can append elements into it directly.
      // By not including allow-scripts, the page itself won't be able to run anything, though
      // we can still access it.
      iframe.sandbox = 'allow-same-origin';

      // If iframe has display: none then Firefox and Chrome will stub certain SVG APIs. Using this alternative
      // approach to hiding the iframe ensures that it will behave more closely to how it would if the SVG was
      // in the regular DOM. (eg. getBBox() would always return 0x0)
      iframe.style.position = 'absolute';
      iframe.style.top = '-10000px';
      iframe.style.left = '-10000px';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.opacity = '0';
      iframe.style.visibility = 'hidden';
      iframe.style.pointerEvents = 'none';
      iframe.tabIndex = -1;
      iframe.ariaHidden = 'true';
      document.body.appendChild(iframe);

      // Use <meta> with a strict CSP so that the elements inside the iframe can't make any requests.
      // Code execution is already blocked by the sandbox attribute but it's also blocked here for an extra layer.
      // It would be better to use srcdoc instead of document.write(), but srcdoc would make us wait until the load
      // event so we would have to become async.
      iframe.contentDocument!.open();
      iframe.contentDocument!.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' data:; font-src data:; img-src data:">
                </head>
                <body></body>
            </html>
            `);
        iframe.contentDocument!.close();
      }

      return iframe.contentDocument!.body;
    };
  }