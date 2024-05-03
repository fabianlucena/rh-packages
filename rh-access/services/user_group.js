import { ServiceOwnerModuleTranslatable } from 'rf-service';
import { checkDataForMissingProperties } from 'sql-util';

export class UserGroupService extends ServiceOwnerModuleTranslatable {
  references = {
    user:  { whereColumn: 'username' },
    group: { whereColumn: 'username' },
  };

  async validateForCreation(data) {
    await checkDataForMissingProperties(data, 'UserGroupService', 'userId', 'groupId');
    return super.validateForCreation(data);
  }

  async getForUsername(username, options) {
    options = {
      ...options,
      where: {
        ...options?.where,
        user: username,
      },
    };

    return this.getList(options);
  }
}