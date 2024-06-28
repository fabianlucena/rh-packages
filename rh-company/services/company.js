import { Service } from 'rf-service';

export class CompanyService extends Service.IdUuidEnableNameUniqueTitleSharedTranslatable {
  viewAttributes = ['uuid', 'isEnabled', 'name', 'title', 'description'];
}