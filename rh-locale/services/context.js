import { Service } from 'rf-service';
import { checkDataForMissingProperties } from 'sql-util';
import { ucfirst } from 'rf-util';

export class ContextService extends Service.IdUuidEnableNameTranslatable {
  async validateForCreation(data) {
    await checkDataForMissingProperties(data, 'Context', 'name');
    data.title ??= ucfirst(data.name);
    return super.validateForCreation(data);
  }
}