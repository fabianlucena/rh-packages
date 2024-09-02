import dependency from 'rf-dependency';
import { conf as localConf } from './conf.js';
import { runSequentially } from 'rf-util';

export const conf = localConf;

conf.updateData = updateData;

async function updateData(global) {
  const data = global?.data;
  if (data.modelsEntitiesNames) {
    const modelEntityNameService = dependency.get('modelEntityNameService');
    await runSequentially(data.modelsEntitiesNames, async data => await modelEntityNameService.createIfNotExists(data));
  }
}