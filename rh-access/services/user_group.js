import { Service } from 'rf-service';
import { checkDataForMissingProperties } from 'sql-util';

export class UserGroupService extends Service.OwnerModuleTranslatable {
  references = {
    user:  { whereColumn: 'username', getIdForName: 'getIdForUsernameOrNull' },
    group: { whereColumn: 'username', getIdForName: 'getIdForUsername' },
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