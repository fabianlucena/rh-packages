'use strict';

import {ProjectService} from './services/project.js';
import {conf as localConf} from './conf.js';
import {runSequentially} from 'rf-util';

export const conf = localConf;

conf.configure = configure;
conf.afterConfig = afterConfig;

async function configure(global, options) {
    if (options.filter)
        conf.filter = options.filter;
}

async function afterConfig(global) {
    const data = global?.data;
    await runSequentially(data?.projects, async data => await ProjectService.createIfNotExists(data));
}