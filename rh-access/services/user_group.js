import { ServiceOwnerModuleTranslatable } from 'rf-service';
import { checkDataForMissingProperties } from 'sql-util';

export class UserGroupService extends ServiceOwnerModuleTranslatable {
  references = {
    User: true,
    Group: true,
  };

  async validateForCreation(data) {
    await checkDataForMissingProperties(data, 'UserGroupService', 'userId', 'groupId');
    return super.validateForCreation(data);
  }
}