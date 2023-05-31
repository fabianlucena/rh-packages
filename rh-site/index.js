import {SiteService} from './services/site.js';
import {conf as localConf} from './conf.js';
import {runSequentially} from 'rf-util';

export const conf = localConf;

conf.afterConfig = afterConfig;

async function afterConfig(global) {
    await runSequentially(global?.data?.sites, async data => await SiteService.createIfNotExists(data));
}
