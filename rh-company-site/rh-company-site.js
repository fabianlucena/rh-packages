
import dependency from 'rf-dependency';
import { conf as localConf } from './conf.js';
import { runSequentially } from 'rf-util';

export const conf = localConf;

conf.configure = configure;
conf.init = [init];
conf.updateData = updateData;

async function configure(global, options) {
  if (options) {
    for (const k of options) {
      conf[k] = options[k];
    }
  }

  dependency.addStatic('getCurrentCompanyId', getCurrentCompanyId);
  dependency.addStatic('getCurrentCompany',   getCurrentCompany);
}

let companySiteService,
  companyService;
async function init() {
  companySiteService = dependency.get('companySiteService');
  companyService = dependency.get('companyService');
}

async function updateData(global) {
  const data = global?.data;
  await runSequentially(data?.companiesSites, async data => await companySiteService.createIfNotExists(data));
}

export function getCurrentCompanyId(context) {
  const siteId = context?.req?.site?.id;
  if (!siteId) {
    return;
  }
        
  return companySiteService.getCompanyIdForSiteId(siteId, { isEnabled: true, skipNoRowsError: true });
}

export async function getCurrentCompany(context) {
  const companyId = await getCurrentCompanyId(context);
  if (!companyId) {
    return;
  }

  return companyService.getSingleForId(companyId);
}