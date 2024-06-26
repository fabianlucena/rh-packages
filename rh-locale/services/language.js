import { Service } from 'rf-service';
import { checkDataForMissingProperties } from 'sql-util';
import { _ConflictError } from 'http-util';
import { loc } from 'rf-locale';

export class LanguageService extends Service.IdUuidEnableNameTranslatable {
  references = {
    parent: 'languageService',
  };

  async validateForCreation(data) {
    await checkDataForMissingProperties(data, 'name');

    const row = await this.getForName(data.name, { skipNoRowsError: true });
    if (row) {
      throw new _ConflictError(loc._f('Cannot create the language because already exists.'));
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