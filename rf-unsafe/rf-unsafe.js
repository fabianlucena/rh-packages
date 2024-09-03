import url from 'url';
import path from 'path';
import { exec } from 'child_process';

const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export class Unsafe {
  options = {};

  async exec(code, context, options) {
    const sanCode = code.replaceAll('"', '\\"')
        .replaceAll('\r', '\\r')
        .replaceAll('\n', '\\n'),
      sanContext = JSON.stringify(context).replaceAll('"', '\\"');

    options = { ...this.options, ...options };
    let command = `node ${dirname}\\exec.js`
      + ` "${sanCode}"`
      + ` "${sanContext}"`;
    for (const opt in options) {
      command += ` --${opt}`;
      const val = options[opt];
      if (val !== true) {
        const sanVal = val.toString().replaceAll('"', '\\"');
        command += ` ${sanVal}`;
      }
    }

    return new Promise((resolve, reject) => {
      exec(
        command,
        (error, stdout, stderr) => {
          if (error) {
            reject(error, stderr);
          }

          let result;
          if (typeof stdout !== 'undefined') {
            try {
              result = JSON.parse(stdout);
            // eslint-disable-next-line no-empty
            } catch {}
          }
          resolve(result, stdout);
        },
      );
    });
  }
}