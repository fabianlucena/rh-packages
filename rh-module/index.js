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

    const moduleService = ModuleService.singleton();
    for (const moduleName in conf?.global?.modules) {
        const module = conf.global.modules[moduleName];
        const moduleData = {
            isEnabled: module.isEnabled,
            name: module.name,
            title: module.title,
            isTranslateble: module.isTranslateble,
            version: module.version,
        };
        await moduleService.createIfNotExists(moduleData);
    }
};
