files = [
  'scratch-sb1-converter.js',
  'jszip.min.js',
  'fontfaceobserver.standalone.js',
  'stackblur.min.js',
  'rgbcolor.js',
  'canvg.min.js',
]

with open('bundle.js', 'w') as f:
  for i in files:
    with open(i) as f2:
      contents = f2.read()
      f.write(contents)
      if not contents.endswith('\n'):
        f.write('\n')
