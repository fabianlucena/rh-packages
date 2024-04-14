import fs from 'fs';

export async function loadJson(fileName, options) {
  options ??= {};

  if (!fs.existsSync(fileName)) {
    if (options.emptyIfNotExists) {
      if (options.debug) {
        console.error(`JSON file ${fileName} does not exist.`);
      }

      return {};
    }

    throw new Error(`JSON file ${fileName} does not exist.`);
  }
    
  const content = fs.readFileSync(fileName, 'utf8');
  const data = JSON.parse(content);

  if (options.debug) {
    console.log(`JSON file ${fileName} loaded.`);
  }

  return data;
}