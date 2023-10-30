import {ServiceIdUuidNameTitleEnableModuleTranslatable} from './rf-service-id-uuid-name-title-enable-module-translatable.js';
import {checkDataForMissingProperties} from 'sql-util';

export class ServiceIdUuidNameTitleDescriptionEnableModuleTranslatable extends ServiceIdUuidNameTitleEnableModuleTranslatable {
    searchColumn = ['name', 'title', 'description'];

    async validateForCreation(data) {
        return await checkDataForMissingProperties(data, this.constructor.name, 'name', 'title', 'description');
    }
}