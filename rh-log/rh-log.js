import { conf as localConf } from './conf.js';
import { LogService } from './services/log.js';
import { Log } from './log.js';

export const conf = localConf;
export const log = new Log;

conf.afterConfig = () => log.setLogService(LogService.singleton());
