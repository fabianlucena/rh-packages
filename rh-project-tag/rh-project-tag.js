'use strict';

import {ProjectTagService} from './services/project_tag.js';
import {conf as localConf} from './conf.js';
import {loc} from 'rf-locale';

export const conf = localConf;

conf.configure = configure;
conf.init = [init];

var projectTagService;
var projectService;

async function configure(global, options) {
    if (options?.tagCategory)
        conf.tagCategory = options.tagCategory;

    global.eventBus?.$on('project.interface.grid.get', projectInterfaceGridGet);
    global.eventBus?.$on('project.interface.form.get', projectInterfaceFormGet);
    global.eventBus?.$on('project.getting', projectGetting);
    global.eventBus?.$on('project.getted', projectGetted);
    global.eventBus?.$on('project.created', projectCreated);
    global.eventBus?.$on('project.updated', projectUpdated);
    global.eventBus?.$on('project.deleting', projectDeleting);
}

async function init() {
    projectTagService = ProjectTagService.singleton();
    projectService = conf.global.services.Project.singleton();
}

async function projectInterfaceGridGet(grid, options) {
    grid.columns.push({
        name:  'tags',
        type:  'tags',
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
            value:   'name',
        },
    });
}

async function projectGetting(options) {
    options.includeTags ??= true;
    if (options.includeTags) {
        if (options.attributes && !options.attributes.includes('id'))
            options.attributes.push('id');
    }
}

async function projectGetted(result, options) {
    return projectTagService.completeForEntities(result, {...options, includeTags: true});
}

async function projectCreated(row, data, options) {
    await projectTagService.updateTagsForEntityId(data.tags, row.id, options);
}

async function projectUpdated(result, data, options) {
    const id = await projectService.getIdFor(options.where);
    if (id)
        await projectTagService.updateTagsForEntityId(data.tags, id, options);
}

async function projectDeleting(result, options) {
    const id = await projectService.getIdFrom(options.where);
    if (id)
        await projectTagService.deleteTagsForEntityId(id, options);
}