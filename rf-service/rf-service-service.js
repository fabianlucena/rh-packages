import { ServiceBase } from './rf-service-base.js';
import { ServiceMixinId } from './rf-service-mixin-id.js';
import { ServiceMixinUuid } from './rf-service-mixin-uuid.js';
import { ServiceMixinEnable } from './rf-service-mixin-enable.js';
import { ServiceMixinName } from './rf-service-mixin-name.js';
import { ServiceMixinUniqueTitle } from './rf-service-mixin-unique-title.js';
import { ServiceMixinOwnerModule } from './rf-service-mixin-owner-module.js';
import { ServiceMixinShared } from './rf-service-mixin-shared.js';
import { ServiceMixinDescription } from './rf-service-mixin-description.js';
import { ServiceMixinTranslatable } from './rf-service-mixin-translatable.js';
import { ServiceMixinIdUuid } from './rf-service-mixin-id-uuid.js';
import { ServiceMixinIdName } from './rf-service-mixin-id-name.js';
import { ServiceMixinIdEnable } from './rf-service-mixin-id-enable.js';
import { ServiceMixinUuidEnable } from './rf-service-mixin-uuid-enable.js';
import { ServiceMixinNameUniqueTitle } from './rf-service-mixin-name-unique-title.js';

const Service = {
  Base: ServiceBase,
  ServiceBase,
  ServiceMixinId,
  ServiceMixinUuid,
  ServiceMixinEnable,
  ServiceMixinName,
  ServiceMixinUniqueTitle,
  ServiceMixinOwnerModule,
  ServiceMixinShared,
  ServiceMixinDescription,
  ServiceMixinTranslatable,
  ServiceMixinIdUuid,
  ServiceMixinIdName,
  ServiceMixinIdEnable,
  ServiceMixinUuidEnable,
  ServiceMixinNameUniqueTitle,
};

export default Service;

const classesData = [
  {
    name: 'Id',
    mixin: ServiceMixinId,
    childMixing: {
      'Uuid': ServiceMixinIdUuid,
      'Name': ServiceMixinIdName,
      'Enable': ServiceMixinIdEnable,
    },
  },
  {
    name: 'Uuid',
    mixin: ServiceMixinUuid,
    childMixing: {
      'Enable': ServiceMixinUuidEnable,
    },
  },
  {
    name: 'Enable',
    mixin: ServiceMixinEnable,
  },
  {
    name: 'Name',
    mixin: ServiceMixinName,
    childMixing: {
      'UniqueTitle': ServiceMixinNameUniqueTitle,
    },
  },
  {
    name: 'UniqueTitle',
    mixin: ServiceMixinUniqueTitle,
  },
  {
    name: 'OwnerModule',
    mixin: ServiceMixinOwnerModule,
  },
  {
    name: 'Shared',
    mixin: ServiceMixinShared,
  },
  {
    name: 'Description',
    mixin: ServiceMixinDescription,
  },
  {
    name: 'Translatable',
    mixin: ServiceMixinTranslatable,
  },
];

const length = classesData.length;
const count = 2 << (length - 1);

for (let i = 1; i < count; i++) {
  let name = '';
  let mixin = ServiceBase;
  let pos = length - 1;
  const ancestors = [];
  do {
    const check = pos? 2 << (pos - 1): 1;
    if ((i & check) === check) {
      const classData = classesData[pos];
      name = classData.name + name;
      mixin = classData.mixin(mixin);
      for (const child in classData.childMixing) {
        if (ancestors.includes(child)) {
          const thisMixin = classData.childMixing[child];
          mixin = thisMixin(mixin);
        }
      }
      ancestors.push(classData.name);
    }
    pos--;
  } while (pos >= 0);

  class ServiceClass extends mixin {};
  Service[name] = ServiceClass;
}


/*
export class Service Id Uuid Enable Name UniqueTitle OwnerModule Shared Description Translatable extends
  ServiceMixinTranslatable(
    ServiceMixinDescription(
      ServiceMixinShared(
        ServiceMixinOwnerModule(
          ServiceMixinNameUniqueTitle(
            ServiceMixinUniqueTitle(
              ServiceMixinIdName(
                ServiceMixinName(
                  ServiceMixinUuidEnable(
                    ServiceMixinEnable(
                      ServiceMixinIdUuid(
                        ServiceMixinUuid(
                          ServiceMixinId(ServiceBase)
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        )
      )
    )
  )
{}
*/
