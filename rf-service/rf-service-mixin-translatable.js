import {ucfirst} from 'rf-util/rf-util-string.js';

export const ServiceMixinTranslatable = Service => class ServiceTranslatable extends Service {
    async getList(options) {
        let result = super.getList(options);

        if (options.translate === false) {
            return result;
        }

        const loc = options.loc;
        if (loc) {
            result = await this.translateRows(await result, loc);
        } else if (options.translate) {
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
        }

        for (const referenceName in this.references) {
            const reference = this.references[referenceName];
            if (!reference) {
                continue;
            }

            let service = reference;
            if (!service?.translateRow) {
                if (reference.service) {
                    service = reference.service;
                }

                if (!service?.prototype?.translateRow) {
                    continue;
                }
            }
            
            let name = ucfirst(referenceName);
            if (!row[name]) {
                name = service.constructor?.name;
                if (name.endsWith('Service')) {
                    name = name.substring(0, name.length - 7);
                }

                if (!row[name]) {
                    continue;
                }
            }

            if (service.translateRow) {
                row[name] = await service.translateRow(row[name], loc, options);
            }
        }

        return row;
    }
};