'use strict';

import {ServiceBase} from './rf-service-base.js';
import {ServiceMixinId} from './rf-service-mixin-id.js';
import {ServiceMixinUuid} from './rf-service-mixin-uuid.js';
import {ServiceMixinIdUuid} from './rf-service-mixin-id-uuid.js';
import {ServiceMixinName} from './rf-service-mixin-name.js';
import {ServiceMixinIdName} from './rf-service-mixin-id-name.js';
import {ServiceMixinEnable} from './rf-service-mixin-enable.js';
import {ServiceMixinUuidEnable} from './rf-service-mixin-uuid-enable.js';

export {ServiceBase, ServiceMixinId, ServiceMixinUuid, ServiceMixinIdUuid, ServiceMixinName, ServiceMixinIdName, ServiceMixinEnable, ServiceMixinUuidEnable};

export class ServiceIdUuid extends ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase))) {}
export class ServiceIdUuidEnable extends ServiceMixinUuidEnable(ServiceMixinEnable(ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase))))) {}
export class ServiceIdUuidNameEnableTranslatable extends ServiceMixinUuidEnable(ServiceMixinEnable(ServiceMixinIdName(ServiceMixinName(ServiceMixinIdUuid(ServiceMixinUuid(ServiceMixinId(ServiceBase))))))) {}