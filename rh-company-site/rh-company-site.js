'use strict';

import {CompanySiteService} from './services/company-site.js';
import {conf as localConf} from './conf.js';
import {runSequentially} from 'rf-util';

export const conf = localConf;

conf.afterConfig = afterConfig;

async function afterConfig(global) {
    const data = global?.data;
    await runSequentially(data?.companiesSites, async data => await CompanySiteService.createIfNotExists(data));
}

export function companyIdFilter() {
    const companyId = 1;
    return companyId;
}
