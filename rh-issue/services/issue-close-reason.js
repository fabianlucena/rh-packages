import { Service } from 'rf-service';

export class IssueCloseReasonService extends Service.IdUuidEnableNameUniqueTitleDescriptionTranslatable {
  defaultTranslationContext = 'issue';
  viewAttributes = ['uuid', 'isEnabled', 'name', 'title', 'isTranslatable', 'isClosed', 'description'];
}