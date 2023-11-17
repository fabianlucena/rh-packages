export const ServiceMixinTranslatable = Service => class ServiceTranslatable extends Service {
    async getList(options) {
        let result = super.getList(options);

        let loc;
        if (options.translate !== false) {
            loc = options.loc;
        }

        if (loc) {
            if (result.then) {
                result = await result;
            }
            
            if (options.withCount) {
                result.rows = await this.translateRows(await result.rows, loc);
            } else {
                result = await this.translateRows(await result, loc);
            }
        } else if (options.translate) {
            console.warn('Cannot translate because no localization (loc) defined.');
        }

        return result;
    }

    async translateRows(rows, loc) {
        return Promise.all(rows.map(row => this.translateRow(row, loc)));
    }

    async translateRow(row, loc, options) {
        if (row.toJSON) {
            row = row.toJSON();
        }

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
            let reference = this.references[referenceName];
            let service = reference;
            if (!service.translateRow) {
                if (reference.service) {
                    service = reference.service;
                }

                if (!service.translateRow) {
                    continue;
                }
            }
            
            let name = service.constructor?.name;
            if (name.endsWith('Service')) {
                name = name.substring(0, name.length - 7);
            }

            if (!row[name]) {
                continue;
            }

            row[name] = await service.translateRow(row[name], loc, options);
        }

        return row;
    }
};