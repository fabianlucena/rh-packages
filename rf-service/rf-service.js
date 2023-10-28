'use strict';

import {ServiceBase} from './rf-service-base.js';
import {ServiceMixinId} from './rf-service-mixin-id.js';
import {ServiceMixinTranslatable} from './rf-service-mixin-translatable.js';
import {ServiceMixinUuid} from './rf-service-mixin-uuid.js';
import {ServiceMixinIdUuid} from './rf-service-mixin-id-uuid.js';
import {ServiceMixinName} from './rf-service-mixin-name.js';
import {ServiceMixinIdName} from './rf-service-mixin-id-name.js';
import {ServiceMixinEnable} from './rf-service-mixin-enable.js';
import {ServiceMixinUuidEnable} from './rf-service-mixin-uuid-enable.js';
import {ServiceMixinShared} from './rf-service-mixin-shared.js';

export {
    ServiceBase,
    ServiceMixinId,
    ServiceMixinTranslatable,
    ServiceMixinUuid,
    ServiceMixinIdUuid,
    ServiceMixinName,
    ServiceMixinIdName,
    ServiceMixinEnable,
    ServiceMixinUuidEnable,
    ServiceMixinShared,
};

export class ServiceId extends ServiceMixinId(ServiceBase) {}
export class ServiceIdTranslatable extends ServiceMixinTranslatable(ServiceMixinId(ServiceBase)) {}
export class ServiceIdUuid extends ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase))) {}
export class ServiceIdUuidEnable extends ServiceMixinUuidEnable(ServiceMixinEnable(ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase))))) {}
export class ServiceIdUuidNameEnableTranslatable extends ServiceMixinTranslatable(ServiceMixinUuidEnable(ServiceMixinEnable(ServiceMixinIdName(ServiceMixinName(ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase)))))))) {}
export class ServiceIdUuidTranslatable extends ServiceMixinTranslatable(ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase)))) {}
export class ServiceShared extends ServiceMixinShared(ServiceBase) {}
export class ServiceSharedEnable extends ServiceMixinEnable(ServiceMixinShared(ServiceBase)) {}
export class ServiceIdUuidNameSharedEnableTranslatable extends ServiceMixinTranslatable(ServiceMixinUuidEnable(ServiceMixinEnable(ServiceMixinShared(ServiceMixinIdName(ServiceMixinName(ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase))))))))) {}
