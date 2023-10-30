import {ServiceIdUuidNameTitleEnabledModuleTranslatable} from './rf-service-id-uuid-name-title-enabled-module-translatable.js';
import {checkDataForMissingProperties} from 'sql-util';

export class ServiceIdUuidNameTitleDescriptionEnabledModuleTranslatable extends ServiceIdUuidNameTitleEnabledModuleTranslatable {
    searchColumn = ['name', 'title', 'description'];

    async validateForCreation(data) {
        return await checkDataForMissingProperties(data, this.constructor.name, 'name', 'title', 'description');
    }
}