import { ServiceBase } from './rf-service-base.js';
import { ServiceMixinId } from './rf-service-mixin-id.js';
import { ServiceMixinTranslatable } from './rf-service-mixin-translatable.js';
import { ServiceMixinUuid } from './rf-service-mixin-uuid.js';
import { ServiceMixinIdUuid } from './rf-service-mixin-id-uuid.js';
import { ServiceMixinName } from './rf-service-mixin-name.js';
import { ServiceMixinIdName } from './rf-service-mixin-id-name.js';
import { ServiceMixinEnabled } from './rf-service-mixin-enabled.js';
import { ServiceMixinUuidEnable } from './rf-service-mixin-uuid-enable.js';
import { ServiceMixinShared } from './rf-service-mixin-shared.js';
import { ServiceMixinOwnerModule } from './rf-service-mixin-owner-module.js';
import { ServiceMixinTitle } from './rf-service-mixin-title.js';
import { ServiceMixinDescription } from './rf-service-mixin-description.js';
export { Op } from './rf-service-op.js';

function OptionalService(options) {
  return {
    ...options,
    optional: true
  };
}

export {
  OptionalService,
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

export class ServiceOwnerModule extends ServiceMixinOwnerModule(ServiceBase) {}
export class ServiceOwnerModuleTranslatable extends ServiceMixinTranslatable(ServiceMixinOwnerModule(ServiceBase)) {}
export class ServiceIdUuidEnabledOwnerModule extends ServiceMixinOwnerModule(ServiceMixinUuidEnable(ServiceMixinEnabled(ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase)))))) {}
export class ServiceIdUuidName extends ServiceMixinIdName(ServiceMixinName(ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase))))) {}
export class ServiceIdUuidNameEnabledOwnerModuleTranslatable extends ServiceMixinTranslatable(ServiceMixinOwnerModule(ServiceMixinUuidEnable(ServiceMixinEnabled(ServiceMixinIdName(ServiceMixinName(ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase))))))))) {}
export class ServiceIdUuidNameTitleEnabledOwnerModuleTranslatable extends ServiceMixinTranslatable(ServiceMixinOwnerModule(ServiceMixinTitle(ServiceMixinUuidEnable(ServiceMixinEnabled(ServiceMixinIdName(ServiceMixinName(ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase)))))))))) {}
export class ServiceIdUuidNameTitleDescriptionEnabledOwnerModuleTranslatable extends ServiceMixinTranslatable(ServiceMixinOwnerModule(ServiceMixinDescription(ServiceMixinTitle(ServiceMixinUuidEnable(ServiceMixinEnabled(ServiceMixinIdName(ServiceMixinName(ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase))))))))))) {}
export class ServiceEnabledOwnerModuleTranslatable extends ServiceMixinTranslatable(ServiceMixinOwnerModule(ServiceMixinEnabled(ServiceBase))) {}

export class ServiceShared extends ServiceMixinShared(ServiceBase) {}
export class ServiceSharedEnabled extends ServiceMixinEnabled(ServiceMixinShared(ServiceBase)) {}
export class ServiceIdUuidNameEnabledSharedTranslatable extends ServiceMixinTranslatable(ServiceMixinUuidEnable(ServiceMixinEnabled(ServiceMixinShared(ServiceMixinIdName(ServiceMixinName(ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase))))))))) {}
export class ServiceIdUuidNameEnabledOwnerModuleSharedTranslatable extends ServiceMixinTranslatable(ServiceMixinUuidEnable(ServiceMixinEnabled(ServiceMixinShared(ServiceMixinOwnerModule(ServiceMixinIdName(ServiceMixinName(ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase)))))))))) {}
export class ServiceIdUuidNameTitleEnabledSharedTranslatable extends ServiceMixinTranslatable(ServiceMixinTitle(ServiceMixinUuidEnable(ServiceMixinEnabled(ServiceMixinShared(ServiceMixinIdName(ServiceMixinName(ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase)))))))))) {}
export class ServiceIdUuidNameTitleDescriptionEnabledSharedTranslatable extends ServiceMixinTranslatable(ServiceMixinShared(ServiceMixinDescription(ServiceMixinTitle(ServiceMixinUuidEnable(ServiceMixinEnabled(ServiceMixinIdName(ServiceMixinName(ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase))))))))))) {}

export class ServiceIdUuidNameTitleEnabledOwnerModuleSharedTranslatable extends ServiceMixinTranslatable(ServiceMixinShared(ServiceMixinOwnerModule(ServiceMixinTitle(ServiceMixinUuidEnable(ServiceMixinEnabled(ServiceMixinIdName(ServiceMixinName(ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase))))))))))) {}
