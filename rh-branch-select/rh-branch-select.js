import { conf as localConf } from './conf.js';

export const conf = localConf;

conf.configure = configure;
conf.init = [init];

async function configure(global, options) {
  if (options?.filters)
    conf.filters = options.filters;
}

var branchService;
async function init() {
  branchService = conf.global.services.Branch.singleton();
}

export async function getAvailableBranchesId(context) {
  if (!conf.filters.getCurrentCompanyId) {
    return null;
  }

  const companyId = await conf.filters.getCurrentCompanyId(context);
  if (!companyId) {
    return;
  }

  return branchService.getIdForCompanyId(companyId, { isEnabled: true, skipNoRowsError: true });
}
