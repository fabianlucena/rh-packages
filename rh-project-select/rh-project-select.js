'use strict';

import {conf as localConf} from './conf.js';

export const conf = localConf;

conf.configure = configure;

async function configure(global, options) {
    if (options?.filters)
        conf.filters = options.filters;
}

export async function projectId(req) {
    if (!conf.filters.companyId)
        return null;

    const companyId = await conf.filters.companyId(req);

    return conf.global.services.Project.getIdForCompanyId(companyId, {skipNoRowsError: true});
}
