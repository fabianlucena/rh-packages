import { Service } from 'rf-service';

export class IssueRelationshipService extends Service.IdUuidEnableNameUniqueTitleDescriptionTranslatable {
  defaultTranslationContext = 'issue';
  viewAttributes = ['uuid', 'isEnabled', 'name', 'title', 'isTranslatable', 'description'];
}