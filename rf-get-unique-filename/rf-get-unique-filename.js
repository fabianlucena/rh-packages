import fs from 'fs';
import path from 'path';

export function getUniqueFilename(filename) {
  if (!fs.existsSync(filename)) {
    return filename;
  }

  const dirname = path.dirname(filename);
  const extname = path.extname(filename);
  const basename = path.basename(filename, extname) + '-';
    
  let c = 0;
  /*eslint no-constant-condition: ["error", { "checkLoops": false }]*/
  while (true) {
    let tryFilename = path.join(dirname, basename + (new String(c)).padStart(6, '0') + extname);
    if (!fs.existsSync(tryFilename)) {
      if (filename.startsWith('./')) {
        tryFilename = './' + tryFilename;
      } else if (filename.startsWith('.\\')) {
        tryFilename = '.\\' + tryFilename;
      }

      return tryFilename;
    }

    c++;
  }
}