import { ServiceIdUuidNameEnabledTranslatable } from 'rf-service';
import { checkDataForMissingProperties } from 'sql-util';

export class IdentityTypeService extends ServiceIdUuidNameEnabledTranslatable {
  async validateForCreation(data) {
    await checkDataForMissingProperties(data, 'IdentityType', 'name', 'title');
    return super.validateForCreation(data);
  }
}