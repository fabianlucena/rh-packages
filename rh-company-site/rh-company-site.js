'use strict';

import {CompanySiteService} from './services/company-site.js';
import {conf as localConf} from './conf.js';
import {runSequentially} from 'rf-util';

export const conf = localConf;

conf.updateData = updateData;

async function updateData(global) {
    const data = global?.data;
    await runSequentially(data?.companiesSites, async data => await CompanySiteService.createIfNotExists(data));
}

export function getCurrentCompanyId(req) {
    if (!req?.site?.id)
        return;
        
    return CompanySiteService.getCompanyIdForSiteId(req.site.id, {isEnabled: true, skipNoRowsError: true});
}
