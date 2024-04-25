import { PageFormatService } from './page_format.js';
import { ServiceIdUuidNameTitleEnabledOwnerModuleSharedTranslatable } from 'rf-service';
import { checkParameterStringNotNullOrEmpty } from 'rf-util';
import { loc } from 'rf-locale';

export class PageService extends ServiceIdUuidNameTitleEnabledOwnerModuleSharedTranslatable {
  references = {
    format: {
      service: 'pageFormatService',
      otherName: 'pageFormat',
    },
    language: true,
  };
  viewAttributes = ['uuid', 'name', 'isTranslatable', 'translationContext', 'title', 'content'];
  skipNoOwnerCheck = true;

  init() {
    super.init();

    this.pageFormatService = PageFormatService.singleton();
  }

  async validateForCreation(data) {
    checkParameterStringNotNullOrEmpty(data.content, loc._cf('page', 'Content'));
    if (!data.formatId) {
      data.formatId = await this.pageFormatService.getIdForName('plain');
    }

    return super.validateForCreation(data);
  }
}