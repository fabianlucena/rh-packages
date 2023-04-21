import {conf as localConf} from './conf.js';

export const conf = localConf;

conf.afterConfigAsync = afterConfigAsync;

async function afterConfigAsync(_, global) {
    for (const siteName in global?.data?.sites) {
        const data = global.data.sites[siteName];
        await global.services.Site.createIfNotExists({...data, name: siteName});
    }
}
