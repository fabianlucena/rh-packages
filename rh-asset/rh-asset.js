import { conf as localConf } from './conf.js';
import { runSequentially } from 'rf-util';
import dependency from 'rf-dependency';

export const conf = localConf;

conf.configure = configure;
conf.updateData = updateData;

async function configure(global, options) {
  for (const k in options) {
    conf[k] = options[k];
  }
}

async function updateData(global) {
  const data = global?.data;
  const assetTypeService =         dependency.get('assetTypeService');
  const assetService =             dependency.get('assetService');

  await runSequentially(data?.assetTypes,         async data => await assetTypeService.        createIfNotExists(data));
  await runSequentially(data?.assets,             async data => await assetService.            createIfNotExists(data));
}