import { PageFormatService } from './page_format.js';
import { Service } from 'rf-service';
import { checkParameterStringNotNullOrEmpty } from 'rf-util';

export class PageService extends Service.IdUuidEnableNameUniqueTitleOwnerModuleSharedTranslatable {
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
    checkParameterStringNotNullOrEmpty(data.content, loc => loc._c('page', 'Content'));
    if (!data.formatId) {
      data.formatId = await this.pageFormatService.getIdForName('plain');
    }

    return super.validateForCreation(data);
  }
}