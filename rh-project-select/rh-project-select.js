'use strict';

import {conf as localConf} from './conf.js';

export const conf = localConf;

conf.configure = configure;

async function configure(global, options) {
    if (options?.filters)
        conf.filters = options.filters;
}

export async function getAvailableProjectsId(req) {
    if (!conf.filters.getCurrentCompanyId)
        return null;

    const companyId = await conf.filters.getCurrentCompanyId(req);
    if (!companyId)
        return;

    return conf.global.services.Project.getIdForCompanyId(companyId, {skipNoRowsError: true});
}
