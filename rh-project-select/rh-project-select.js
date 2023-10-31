import {conf as localConf} from './conf.js';

export const conf = localConf;

conf.configure = configure;
conf.init = [init];

async function configure(global, options) {
    if (options?.filters) {
        conf.filters = options.filters;
    }
}

var projectService;
async function init() {
    projectService = conf.global.services.Project.singleton();
}

export async function getAvailableProjectsId(req) {
    if (!conf.filters.getCurrentCompanyId) {
        return null;
    }

    const companyId = await conf.filters.getCurrentCompanyId(req);
    if (!companyId) {
        return;
    }

    return projectService.getIdForCompanyId(companyId, {isEnabled: true, skipNoRowsError: true});
}
