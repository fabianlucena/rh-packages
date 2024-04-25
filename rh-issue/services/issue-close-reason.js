import { ServiceIdUuidNameTitleDescriptionEnabledTranslatable } from 'rf-service';

export class IssueCloseReasonService extends ServiceIdUuidNameTitleDescriptionEnabledTranslatable {
  defaultTranslationContext = 'issue';
  viewAttributes = ['uuid', 'isEnabled', 'name', 'title', 'isTranslatable', 'isClosed', 'description'];
}