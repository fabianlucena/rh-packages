import { ServiceIdUuidName } from 'rf-service';
import { checkDataForMissingProperties } from 'sql-util';

export class ModelEntityNameService extends ServiceIdUuidName {
  async validateForCreation(data) {
    await checkDataForMissingProperties(data, 'ModelEntityName', 'name');
    return super.validateForCreation(data);
  }
}