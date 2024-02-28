import {ServiceBase} from './rf-service-base.js';
import {ServiceMixinId} from './rf-service-mixin-id.js';
import {ServiceMixinTranslatable} from './rf-service-mixin-translatable.js';
import {ServiceMixinUuid} from './rf-service-mixin-uuid.js';
import {ServiceMixinIdUuid} from './rf-service-mixin-id-uuid.js';
import {ServiceMixinName} from './rf-service-mixin-name.js';
import {ServiceMixinIdName} from './rf-service-mixin-id-name.js';
import {ServiceMixinEnabled} from './rf-service-mixin-enabled.js';
import {ServiceMixinUuidEnable} from './rf-service-mixin-uuid-enable.js';
import {ServiceMixinShared} from './rf-service-mixin-shared.js';
import {ServiceMixinModule} from './rf-service-mixin-module.js';
import {ServiceMixinTitle} from './rf-service-mixin-title.js';
import {ServiceMixinDescription} from './rf-service-mixin-description.js';

export {
    ServiceBase,
    ServiceMixinId,
    ServiceMixinTranslatable,
    ServiceMixinUuid,
    ServiceMixinIdUuid,
    ServiceMixinName,
    ServiceMixinIdName,
    ServiceMixinEnabled,
    ServiceMixinUuidEnable,
    ServiceMixinShared,
    ServiceMixinTitle,
    ServiceMixinDescription,
};

export class ServiceId extends ServiceMixinId(ServiceBase) {}
export class ServiceIdTranslatable extends ServiceMixinTranslatable(ServiceMixinId(ServiceBase)) {}
export class ServiceIdUuid extends ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase))) {}
export class ServiceIdUuidEnabled extends ServiceMixinUuidEnable(ServiceMixinEnabled(ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase))))) {}
export class ServiceIdUuidTranslatable extends ServiceMixinTranslatable(ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase)))) {}
export class ServiceIdUuidNameEnabledTranslatable extends ServiceMixinTranslatable(ServiceMixinUuidEnable(ServiceMixinEnabled(ServiceMixinIdName(ServiceMixinName(ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase)))))))) {}
export class ServiceIdUuidNameTitleTranslatable extends ServiceMixinTranslatable(ServiceMixinTitle(ServiceMixinIdName(ServiceMixinName(ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase))))))) {}
export class ServiceIdUuidNameTitleEnabledTranslatable extends ServiceMixinTranslatable(ServiceMixinTitle(ServiceMixinUuidEnable(ServiceMixinEnabled(ServiceMixinIdName(ServiceMixinName(ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase))))))))) {}
export class ServiceIdUuidNameTitleDescriptionTranslatable extends ServiceMixinTranslatable(ServiceMixinDescription(ServiceMixinTitle(ServiceMixinEnabled(ServiceMixinIdName(ServiceMixinName(ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase))))))))) {}
export class ServiceIdUuidNameTitleDescriptionEnabledTranslatable extends ServiceMixinTranslatable(ServiceMixinDescription(ServiceMixinTitle(ServiceMixinUuidEnable(ServiceMixinEnabled(ServiceMixinIdName(ServiceMixinName(ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase)))))))))) {}

export class ServiceModule extends ServiceMixinModule(ServiceBase) {}
export class ServiceModuleTranslatable extends ServiceMixinTranslatable(ServiceMixinModule(ServiceBase)) {}
export class ServiceIdUuidEnabledModule extends ServiceMixinModule(ServiceMixinUuidEnable(ServiceMixinEnabled(ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase)))))) {}
export class ServiceIdUuidName extends ServiceMixinIdName(ServiceMixinName(ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase))))) {}
export class ServiceIdUuidNameEnabledModuleTranslatable extends ServiceMixinTranslatable(ServiceMixinModule(ServiceMixinUuidEnable(ServiceMixinEnabled(ServiceMixinIdName(ServiceMixinName(ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase))))))))) {}
export class ServiceIdUuidNameTitleEnabledModuleTranslatable extends ServiceMixinTranslatable(ServiceMixinModule(ServiceMixinTitle(ServiceMixinUuidEnable(ServiceMixinEnabled(ServiceMixinIdName(ServiceMixinName(ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase)))))))))) {}
export class ServiceIdUuidNameTitleDescriptionEnabledModuleTranslatable extends ServiceMixinTranslatable(ServiceMixinModule(ServiceMixinDescription(ServiceMixinTitle(ServiceMixinUuidEnable(ServiceMixinEnabled(ServiceMixinIdName(ServiceMixinName(ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase))))))))))) {}
export class ServiceEnabledModuleTranslatable extends ServiceMixinTranslatable(ServiceMixinModule(ServiceMixinEnabled(ServiceBase))) {}

export class ServiceShared extends ServiceMixinShared(ServiceBase) {}
export class ServiceSharedEnabled extends ServiceMixinEnabled(ServiceMixinShared(ServiceBase)) {}
export class ServiceIdUuidNameEnabledSharedTranslatable extends ServiceMixinTranslatable(ServiceMixinUuidEnable(ServiceMixinEnabled(ServiceMixinShared(ServiceMixinIdName(ServiceMixinName(ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase))))))))) {}
export class ServiceIdUuidNameTitleEnabledSharedTranslatable extends ServiceMixinTranslatable(ServiceMixinTitle(ServiceMixinUuidEnable(ServiceMixinEnabled(ServiceMixinShared(ServiceMixinIdName(ServiceMixinName(ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase)))))))))) {}
export class ServiceIdUuidNameTitleDescriptionEnabledSharedTranslatable extends ServiceMixinTranslatable(ServiceMixinShared(ServiceMixinDescription(ServiceMixinTitle(ServiceMixinUuidEnable(ServiceMixinEnabled(ServiceMixinIdName(ServiceMixinName(ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase))))))))))) {}

export class ServiceIdUuidNameTitleEnabledModuleSharedTranslatable extends ServiceMixinTranslatable(ServiceMixinShared(ServiceMixinModule(ServiceMixinTitle(ServiceMixinUuidEnable(ServiceMixinEnabled(ServiceMixinIdName(ServiceMixinName(ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase))))))))))) {}
