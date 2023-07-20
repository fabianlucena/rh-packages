'use strict';

import {conf as localConf} from './conf.js';
import {loc} from 'rf-locale';

export const conf = localConf;

conf.configure = configure;

async function configure(global, options) {
    if (options?.tagCategory)
        conf.tagCategory = options.tagCategory;

    global.eventBus?.$on('project.interface.grid.get', projectInterfaceGridGet);
    global.eventBus?.$on('project.interface.form.get', projectInterfaceFormGet);
}

async function projectInterfaceGridGet(grid, options) {
    grid.columns.push({
        alias: 'tags',
        name:  'tags',
        type:  'text',
        label: await (options.loc ?? loc)._c('project', 'Tags'),
    });
}

async function projectInterfaceFormGet(form, options) {
    form.fields.push({
        name:  'tags',
        type:  'tags',
        label: await (options.loc ?? loc)._c('project', 'Tags'),
        loadOptionsFrom: {
            service: 'tag',
            params:  {tagCategory: conf.tagCategory},
            value:   'uuid',
            text:    'name',
            title:   'description',
        },
    });
}
