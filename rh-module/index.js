import {ModuleService} from './services/module.js';
import {conf as localConf} from './conf.js';

export const conf = localConf;

conf.afterConfig = async function() {
    for (const moduleName in conf?.global?.modules)
        await ModuleService.createIfNotExists(conf.global.modules[moduleName]);
};
