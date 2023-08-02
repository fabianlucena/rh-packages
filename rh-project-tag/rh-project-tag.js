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
    if (options) {
        const transferProperties = ['tagCategory', 'tagsTitle', 'permissions'];
        for (const propertyName of transferProperties) {
            const value = options[propertyName];
            if (value !== undefined)
                conf[propertyName] = value;
        }
    }

    if (!options.permissions)
        options.permissions = [];
    else if (!Array.isArray(options.permissions))
        options.permissions = [options.permissions];

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

loc._cf('project', 'Tag');

async function getTagTitle(options) {
    return await (options.loc ?? loc)._c('project', conf.tagsTitle ?? 'Tags');
}

async function projectInterfaceGridGet(grid, options) {
    grid.columns.push({
        name:  'tags',
        type:  'tags',
        label: await getTagTitle(options),
    });
}

async function projectInterfaceFormGet(form, options) {
    form.fields.push({
        name:  'tags',
        type:  'tags',
        label: await getTagTitle(options),
        loadOptionsFrom: {service: 'project-tag/tags'},
    });
}

async function projectGetting(options) {
    if (options.includeTags) {
        if (options.attributes && !options.attributes.includes('id'))
            options.attributes.push('id');
    }
}

async function projectGetted(result, options) {
    return projectTagService.completeForEntities(result, options);
}

async function projectCreated(row, data, options) {
    await projectTagService.updateTagsForEntityId(data.tags, row.id, options);
}

async function projectUpdated(result, data, options) {
    const id = await projectService.getIdFor(options.where);
    if (id)
        await projectTagService.updateTagsForEntityId(data.tags, id, options);
}

async function projectDeleting(options) {
    const id = await projectService.getIdFor(options.where);
    if (id)
        await projectTagService.deleteTagsForEntityId(id, options);
}