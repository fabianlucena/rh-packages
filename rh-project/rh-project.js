'use strict';

import {ProjectService} from './services/project.js';
import {conf as localConf} from './conf.js';
import {runSequentially} from 'rf-util';

export const conf = localConf;

conf.afterConfigAsync = afterConfigAsync;

async function afterConfigAsync(_, global) {
    const data = global?.data;
    await runSequentially(data?.projects, async data => await ProjectService.createIfNotExists(data));
}