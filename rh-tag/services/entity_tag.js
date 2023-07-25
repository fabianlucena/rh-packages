'use strict';

import {TagService} from './tag.js';
import {TagCategoryService} from './tag_category.js';
import {ServiceBase} from 'rf-service';
import {ucfirst, checkParameterStringNotNullOrEmpty} from 'rf-util';
import {ConflictError} from 'http-util';
import {loc} from 'rf-locale';
import {completeIncludeOptions} from 'sql-util';

export class EntityTagService extends ServiceBase {
    references = {
        tag: {
            service: TagService,
            function: async data => await this.completeTagsIdInData(data),
        }
    };

    constructor(options) {
        super();
        for (const k in options)
            this[k] = options[k];

        this.references[this.entityName] = this.entityModel;
        this.tagCategoryService = TagCategoryService.singleton();
        this.tagService = TagService.singleton();

        if (this.entityId)
            this.notEntityId ||= 'not' + ucfirst(this.entityId);
    }

    async completeTagsIdInData(data) {
        if (data.tags) {
            let tags = data.tags;
            if (!Array.isArray(tags))
                tags = [tags];

            const tagCategory = await this.tagCategoryService.createIfNotExists({
                name: this.tagCategory,
                title: this.tagCategory,
            });
            const tagCategoryId = tagCategory.id;

            data.tagId ??= [];
            for (const tagName of tags) {
                const tag = await this.tagService.createIfNotExists({
                    name: tagName,
                    tagCategoryId,
                });
                data.tagId.push(tag.id);
            }
            
            delete data.tags;
        }

        return data;
    }

    async validateForCreation(data) {
        checkParameterStringNotNullOrEmpty(data[this.entityId], loc._cf('entityTag', this.entityName));
        checkParameterStringNotNullOrEmpty(data.tagId, loc._cf('entityTag', 'Tag'));

        const rows = await this.getFor(data, {skipNoRowsError: true});
        if (rows.length)
            throw new ConflictError(loc._cf('entityTag', 'The tag is already linked to the %s.', this.entityName));

        return true;
    }

    async updateTagsForEntityId(tags, entityId, options) {
        if (!entityId)
            return;

        let result = 0;
        const entitiesId = Array.isArray(entityId)? entityId: [entityId];
        if (!entitiesId?.length)
            return;

        const data = await this.completeReferences({tags}, true);
        if (!data.tagId?.length)
            return;

        for (const entityId of entitiesId) {
            for (const tagId of data.tagId) {
                const data = {[this.entityId]: entityId, tagId};
                const rows = await this.getFor(data, {skipNoRowsError: true});
                if (rows?.length)
                    continue;

                await this.create(data, options);
                result++;
            }

            result += await this.deleteFor({[this.entityId]: entityId, notTagId: data.tagId}, {...options, where: undefined});
        }

        return result;
    }

    async deleteTagsForEntityId(entityId, options) {
        return this.deleteFor({[this.entityId]: entityId}, {...options, where: undefined});
    }

    async delete(options) {
        if (!options.where)
            throw new Error(loc._cf('Delete without where is forbiden.'));

        const Op = this.Sequelize.Op;
        const where = options.where;
        const filters = where[Op.and] ??= [];

        if (this.entityId) {
            let value = where[this.entityId];
            if (value) {
                filters.push({[this.entityId]: value});
                delete where[this.entityId];
            }

            if (this.notEntityId) {
                value = where[this.notEntityId];
                if (value) {
                    filters.push({[this.entityId]: {[Op.notIn]: value}});
                    delete where[this.notEntityId];
                }
            }
        }

        if (where.tagId) {
            filters.push({tagId: options.where.tagId});
            delete options.where.tagId;
        }

        if (where.notTagId) {
            filters.push({tagId: {[Op.notIn]: options.where.notTagId}});
            delete options.where.notTagId;
        }

        return super.delete(options);
    }

    async getForEntityId(entityId, options) {
        options = {
            attributes: [],
            raw: true,
            nest: true,
            ...options,
            where: {
                ...options?.where,
                [this.entityId]: entityId,
            },
        };

        completeIncludeOptions(
            options,
            'Tag',
            {
                model: this.models.Tag,
                attributes: ['name'],
            }
        );

        return this.getList(options);
    }

    async completeForEntities(result, options) {
        if (!options.includeTags)
            return result;

        result = await result;
        let rows = options.withCount? result.rows: result;

        for (const i in rows) {
            let row = rows[i];
            if (row.toJSON)
                row = row.toJSON();

            const tags = await this.getForEntityId(row.id);
            row.tags = tags.map(tag => tag.Tag.name);

            rows[i] = row;
        }

        if (options.withCount)
            result.rows = rows;
        else
            result = rows;

        return result;
    }
}