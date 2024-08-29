import { Service } from 'rf-service';
import { checkDataForMissingProperties } from 'sql-util';
import { ConflictError } from 'http-util';

export class LanguageService extends Service.IdUuidEnableNameTranslatable {
  references = {
    parent: 'languageService',
  };

  async validateForCreation(data) {
    await checkDataForMissingProperties(data, 'name');

    const row = await this.getForName(data.name, { skipNoRowsError: true });
    if (row && row.length > 0) {
      throw new ConflictError(loc => loc._('Cannot create the language because already exists.'));
    }

    if (!data.parentId) {
      const nameParts = data.name.split('-');
      if (nameParts.length === 2) {
        const parent = await this.createIfNotExists({ name: nameParts[0].trim(), title: nameParts[0].trim() });
        data.parentId = parent.id;
      }
    }

    return super.validateForCreation(data);
  }
}