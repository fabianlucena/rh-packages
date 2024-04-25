import { ServiceIdUuidNameEnabledTranslatable } from 'rf-service';
import { checkDataForMissingProperties } from 'sql-util';

export class DomainService extends ServiceIdUuidNameEnabledTranslatable {
  async validateForCreation(data) {
    await checkDataForMissingProperties(data, 'Domain', 'name', 'title');
    return super.validateForCreation(data);
  }
}