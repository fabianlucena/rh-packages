import { ServiceIdUuidNameTitleEnabledSharedTranslatable } from 'rf-service';

export class CompanyService extends ServiceIdUuidNameTitleEnabledSharedTranslatable {
  viewAttributes = ['uuid', 'isEnabled', 'name', 'title', 'description'];
}