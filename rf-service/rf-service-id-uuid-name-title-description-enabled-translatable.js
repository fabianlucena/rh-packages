import {ServiceBase} from './rf-service-base.js';
import {ServiceMixinId} from './rf-service-mixin-id.js';
import {ServiceMixinTranslatable} from './rf-service-mixin-translatable.js';
import {ServiceMixinUuid} from './rf-service-mixin-uuid.js';
import {ServiceMixinIdUuid} from './rf-service-mixin-id-uuid.js';
import {ServiceMixinName} from './rf-service-mixin-name.js';
import {ServiceMixinIdName} from './rf-service-mixin-id-name.js';
import {ServiceMixinEnabled} from './rf-service-mixin-enabled.js';
import {ServiceMixinUuidEnable} from './rf-service-mixin-uuid-enable.js';
import {ServiceMixinTitle} from './rf-service-mixin-title.js';
import {ServiceMixinDescription} from './rf-service-mixin-description.js';

export class ServiceIdUuidNameTitleDescriptionEnabledTranslatable extends 
    ServiceMixinTranslatable(
        ServiceMixinDescription(
            ServiceMixinTitle(
                ServiceMixinUuidEnable(
                    ServiceMixinEnabled(
                        ServiceMixinIdName(
                            ServiceMixinName(
                                ServiceMixinIdUuid(
                                    ServiceMixinUuid(
                                        ServiceMixinId(ServiceBase)))))))))) {
    async getListOptions(options) {
        options ??= {};

        if (options.view) {
            if (!options.attributes) {
                options.attributes = ['uuid', 'isEnabled', 'name', 'title', 'isTranslatable', 'description'];
            }
        }

        return super.getListOptions(options);
    }
}