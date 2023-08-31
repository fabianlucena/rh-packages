'use strict';

import {PageFormatService} from './services/page_format.js';
import {PageService} from './services/page.js';
import {conf as localConf} from './conf.js';
import {runSequentially} from 'rf-util';

export const conf = localConf;

conf.updateData = async function(global) {
    const pageFormatService = PageFormatService.singleton();
    const pageService = PageService.singleton();

    await runSequentially(global?.data?.pageFormats, async format => await pageFormatService.createIfNotExists(format));
    await runSequentially(global?.data?.pages,       async page   => await pageService.      createIfNotExists(page));
};
