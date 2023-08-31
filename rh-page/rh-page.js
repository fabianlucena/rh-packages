'use strict';

import {PageService} from './services/page.js';
import {conf as localConf} from './conf.js';
import {runSequentially} from 'rf-util';

export const conf = localConf;

conf.updateData = async function(global) {
    const pageService = PageService.singleton();

    await runSequentially(global?.data?.pages, async page => await pageService.createIfNotExists(page));
};
