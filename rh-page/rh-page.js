import {PageFormatService} from './services/page_format.js';
import {PageService} from './services/page.js';
import {ResourceTypeService} from './services/resource_type.js';
import {ResourceService} from './services/resource.js';
import {conf as localConf} from './conf.js';
import {runSequentially} from 'rf-util';

export const conf = localConf;

conf.updateData = async function(global) {
    const pageFormatService = PageFormatService.singleton();
    const pageService = PageService.singleton();
    const resourceTypeService = ResourceTypeService.singleton();
    const resourceService = ResourceService.singleton();

    await runSequentially(global?.data?.pageFormats,   async format   => await pageFormatService.  createIfNotExists(format));
    await runSequentially(global?.data?.pages,         async page     => await pageService.        createIfNotExists(page));
    await runSequentially(global?.data?.resourceTypes, async type     => await resourceTypeService.createIfNotExists(type));
    await runSequentially(global?.data?.resources,     async resource => await resourceService.    createIfNotExists(resource));
};
