import { ServiceIdUuidNameTitleDescriptionEnabledTranslatable } from 'rf-service';

export class IssuePriorityService extends ServiceIdUuidNameTitleDescriptionEnabledTranslatable {
  defaultTranslationContext = 'issue';
  viewAttributes = ['uuid', 'isEnabled', 'name', 'title', 'isTranslatable', 'description'];
}