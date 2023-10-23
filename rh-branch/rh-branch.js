import {BranchService} from './services/branch.js';
import {conf as localConf} from './conf.js';
import {runSequentially} from 'rf-util';

export const conf = localConf;

conf.configure = configure;
conf.updateData = updateData;

async function configure(global, options) {
    for (const k in options) {
        conf[k] = options[k];
    }
}

async function updateData(global) {
    const data = global?.data;
    const branchService = BranchService.singleton();

    await runSequentially(data?.branches, async data => await branchService.createIfNotExists(data));
}