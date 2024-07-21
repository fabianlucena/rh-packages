import { runSequentially } from 'rf-util';
import { conf as localConf } from './conf.js';
import dependency from 'rf-dependency';

export const conf = localConf;

conf.updateData = async function(global) {
  const perspectiveService =  dependency.get('perspectiveService');
  
  await runSequentially(global?.data?.perspectives, async data => await perspectiveService.createIfNotExists(data));
};
