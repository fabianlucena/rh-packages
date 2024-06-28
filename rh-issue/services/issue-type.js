import { Service } from 'rf-service';

export class IssueTypeService extends Service.IdUuidEnableNameUniqueTitleDescriptionTranslatable {
  defaultTranslationContext = 'issue';
  viewAttributes = ['uuid', 'isEnabled', 'name', 'title', 'isTranslatable', 'description'];
}