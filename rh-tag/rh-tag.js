'use strict';

import {TagCategoryService} from './services/tag_category.js';
import {TagService} from './services/tag.js';
import {conf as localConf} from './conf.js';
import {runSequentially} from 'rf-util';

export const conf = localConf;

conf.updateData = updateData;

async function updateData(global) {
    await runSequentially(global?.data?.tagCategories, async data => await TagCategoryService.singleton().createIfNotExists(data));
    await runSequentially(global?.data?.tags,          async data => await TagService.        singleton().createIfNotExists(data));
}
