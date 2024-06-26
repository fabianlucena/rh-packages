import { Service } from 'rf-service';
import { checkDataForMissingProperties } from 'sql-util';

export class DomainService extends Service.IdUuidEnableNameTranslatable {
  async validateForCreation(data) {
    await checkDataForMissingProperties(data, 'Domain', 'name', 'title');
    return super.validateForCreation(data);
  }
}