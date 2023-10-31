import {ModuleService} from './services/module.js';
import {conf as localConf} from './conf.js';

export const conf = localConf;

conf.updateData = async function() {
    const updateData = conf?.global?.config?.db?.updateData;
    if (updateData?.skip?.length && updateData.skip.includes('modules')) {
        return;
    }
    
    if (updateData?.include?.length && !updateData.include.includes('modules')) {
        return;
    }

    for (const moduleName in conf?.global?.modules) {
        await ModuleService.singleton().createIfNotExists(conf.global.modules[moduleName]);
    }
};
