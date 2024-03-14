import { ModuleService } from './services/module.js';
import { conf as localConf } from './conf.js';
import dependency from 'rf-dependency';

export const conf = localConf;

conf.configure = configure;
conf.updateData = updateData;

async function configure() {
    dependency.addSingleton('moduleService', ModuleService);
    dependency.addSingleton('ownerModuleService', ModuleService);
}

async function updateData() {
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
}
