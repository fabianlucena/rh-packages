import vm from 'vm';

const args = process.argv.slice(2);
let code,
  context,
  options = {
    exclude: [],
  },
  vmOptions = {
    timeout: 250,
  };
for (let i = 0, e = args.length; i < e; i++) {
  const arg = args[i];
  switch(arg) {
  case '--safe':
    options.safe = true;
    break;

  case '--timeout':
    i++;
    vmOptions.timeout = Number(args[i]);
    break;

  default:
    if (!code) {
      code = arg;
      if (!code) {
        process.exit();
      }
      
      code = code.replaceAll('\\r', '\r')
        .replaceAll('\\n', '\n');
    } else if (typeof context === 'undefined') {
      context = arg;
      if (context) {
        context = JSON.parse(context);
      }
    } else {
      process.stderr.write(`Unknown param ${arg}.\r\n`);
      process.exit(1);
    }
  }
}

if (options.safe) {
  options.exclude.push(
    /import[\s(]/,
    /require\s*\(/,
    /console\s*\./,
    /fetch\s*\(/,
  );

  context.require ??= null;
  context.console ??= null;
  context.fetch   ??= null;
}

for (const pat of options.exclude) {
  if (pat.test(code)) {
    process.stderr.write(`Invalid use of ${pat.toString()}.\r\n`);
    process.exit(1);
  }
}

vm.createContext(context);
const result = vm.runInContext(code, context, vmOptions);

process.stdout.write(JSON.stringify(result) + '\r\n');