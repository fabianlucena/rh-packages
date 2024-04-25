import { ServiceIdUuidNameTitleDescriptionEnabledTranslatable } from 'rf-service';

export class IssueTypeService extends ServiceIdUuidNameTitleDescriptionEnabledTranslatable {
  defaultTranslationContext = 'issue';
  viewAttributes = ['uuid', 'isEnabled', 'name', 'title', 'isTranslatable', 'description'];
}