import { Service } from 'rf-service';

export class IssueRelatedService extends Service.Translatable {
  references = {
    from:         'issueService',
    to:           'issueService',
    relationship: 'issueRelationshipService',
  };
  defaultTranslationContext = 'issue';
}