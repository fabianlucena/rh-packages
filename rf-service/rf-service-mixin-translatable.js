import { defaultLoc } from 'rf-locale';

export const ServiceMixinTranslatable = Service => class ServiceTranslatable extends Service {
  async getList(options) {
    let result = await super.getList(options);

    if (options?.translate === false) {
      return result;
    }

    const loc = options?.loc ?? defaultLoc;
    if (loc) {
      result = await this.translateRows(result, loc, options);
    } else if (options?.translate) {
      console.warn('Cannot translate because no localization (loc) defined.');
    }

    return result;
  }

  async translateRows(rows, loc, options) {
    return Promise.all(rows.map(row => this.translateRow(row, loc, options)));
  }

  async translateRow(row, loc, options) {
    if (row.isTranslatable && this.translatableColumns?.length) {
      const translationContext = row.translationContext ?? this.defaultTranslationContext ?? null;
      await Promise.all(this.translatableColumns.map(async field => {
        row[field] = await loc._c(translationContext, row[field]);
      }));
    }

    if (!options?.skipDeleteIsTranslatable) {
      delete row.isTranslatable;
      delete row.translationContext;
    }

    for (const name in this.references) {
      const reference = this.references[name];
      if (!reference || !row[name]) {
        continue;
      }

      let service = reference;
      if (!service?.translateRow) {
        if (reference.service) {
          service = reference.service;
        }

        if (!service?.translateRow
          && !service?.prototype?.translateRow
        ) {
          continue;
        }
      }

      row[name] = await service.translateRow(row[name], loc, options);
    }

    return row;
  }
};