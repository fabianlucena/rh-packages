'use strict';

import {TagCategoryService} from './services/tag_category.js';
import {TagService} from './services/tag.js';
import {conf as localConf} from './conf.js';
import {runSequentially} from 'rf-util';

export const conf = localConf;

conf.updateData = updateData;

async function updateData(global) {
    const tagCategoryService = TagCategoryService.singleton();
    const tagService = TagService.singleton();

    await runSequentially(global?.data?.tagCategories, async data => await tagCategoryService.createIfNotExists(data));
    await runSequentially(global?.data?.tags,          async data => await tagService.        createIfNotExists(data));
}

export {EntityTagService} from './services/entity_tag.js';