import { Service } from 'rf-service';
import { checkDataForMissingProperties } from 'sql-util';

export class ModelEntityNameService extends Service.IdUuidName {
  async validateForCreation(data) {
    await checkDataForMissingProperties(data, 'ModelEntityName', 'name');
    return super.validateForCreation(data);
  }
}