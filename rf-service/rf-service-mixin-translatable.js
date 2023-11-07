export const ServiceMixinTranslatable = Service => class ServiceTranslatable extends Service {
    async getList(options) {
        let result = super.getList(options);

        let loc;
        if (options.translate !== false) {
            loc = options.loc;
        }

        if (loc) {
            result = await result;
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

        return row;
    }
};