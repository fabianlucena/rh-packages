import { conf } from '../conf.js';
import { ServiceIdUuidTranslatable } from 'rf-service';
import { completeIncludeOptions } from 'sql-util';
import { checkParameterNotNullOrEmpty, _Error } from 'rf-util';
import { loc } from 'rf-locale';
import { _ConflictError } from 'http-util';

export class EavValueTagService extends ServiceIdUuidTranslatable {
    Sequelize = conf.global.Sequelize;
    sequelize = conf.global.sequelize;
    model = conf.global.models.EavValueTag;
    references = {
        attribute: true,
        tag:       'attributeTagService',
    };

    async validateForCreation(data) {
        checkParameterNotNullOrEmpty(data.attributeId, loc._cf('eav', 'Attribute'));
        checkParameterNotNullOrEmpty(data.tagId,       loc._cf('eav', 'Tag'));

        const rows = await this.getFor(data, {skipNoRowsError: true});
        if (rows.length) {
            throw new _ConflictError(loc._cf('eav', 'The tag is already linked to the entity.'));
        }

        return super.validateForCreation(data);
    }

    async getListOptions(options) {
        options ||= {};

        if (options.includeAttribute
            || options.where?.attribute
            || options.includeTag
            || options.where?.attributeTagUuid
            || options.where?.tags
        ) {
            const attributes = (options.includeTag === true)?
                ['uuid', 'name', 'description']:
                (!options.includeTag)?
                    []:
                    options.includeTag;

            let where;
            if (options.q) {
                const q = `%${options.q}%`;
                const Op = this.Sequelize.Op;
                where ??= {};
                where.name = {[Op.like]: q};
                delete options.q;
            }

            if (options.where?.tags) {
                where ??= {};
                where.name = options.where.tags;
                delete options.where.tags;
            }

            if (options.where?.attributeTagUuid) {
                where ??= {};
                where.uuid = options.where.attributeTagUuid;
                delete options.where?.attributeTagUuid;
            }

            if (options.where?.tagId) {
                where ??= {};
                where.id = options.where.tagId;
                delete options.where?.tagId;
            }

            const EavAttributeTagOptions = {
                model: conf.global.models.EavAttributeTag,
                as: 'Tag',
                attributes,
            };

            if (where) {
                EavAttributeTagOptions.where = where;
            }
            
            if (options.includeAttribute || options.where?.attribute) {
                const attributes = (options.includeAttribute === true)?
                    ['uuid', 'name', 'description']:
                    (!options.includeAttribute)?
                        []:
                        options.includeAttribute;
    
                let where;
                if (options.where?.attribute) {
                    where ??= {};
                    where.name = options.where.attribute;
                    delete options.where.attribute;
                }

                const EavAttributeOptions = {
                    model: conf.global.models.EavAttribute,
                    attributes,
                };

                if (where) {
                    EavAttributeOptions.where = where;
                }
    
                const includeAttributeOptions = completeIncludeOptions(
                    null,
                    'EavAttribute',
                    EavAttributeOptions,
                );

                EavAttributeTagOptions.include = includeAttributeOptions.include[0];
            }

            completeIncludeOptions(
                options,
                'EavAttributeTag',
                EavAttributeTagOptions,
            );
        }

        return super.getListOptions(options);
    }

    async completeTagsIdInData(data) {
        if (data.tags) {
            let tags = data.tags;
            if (!Array.isArray(tags)) {
                tags = [tags];
            }

            const attributeId = data.atributeId;
            if (!attributeId) {
                throw new _Error(loc._cf('eav', 'No attribute for tag creation.'));
            }

            const ownerModuleId = data.ownerModuleId;
            data.tagId ??= [];
            for (const name of tags) {
                const tag = await this.attributeTagService.createIfNotExists({
                    name,
                    attributeId,
                    ownerModuleId,
                });
                data.tagId.push(tag.id);
            }
            
            delete data.tags;
        }

        return data;
    }

    /**
     * Update the tags values for an entity or entities.
     * @param {object} data An objet with tree properties see below.
     * @param {object} options Sequelize options with loc property. 
     * @returns updated rows count.
     * 
     * The data object must have the following properties:
     * - attributeId: the ID of the attribute definition.
     * - entityId: the ID or ID list of the entity/ies who has the tags.
     * - value: the tag or tags list.
     * 
     * For each entityId the method link the given tags. And only the given tags,
     * other tags than values will be remove from the entities.
     */
    async updateValue(data, options) {
        if (!data.attributeId) {
            throw new _Error(loc._f('Cannot update option value because attributeId data is missing or empty'));
        }

        if (!data.entityId) {
            throw new _Error(loc._f('Cannot update option value because entityId data is missing or empty'));
        }

        if (data.value === undefined) {
            return;
        }

        const entitiesId = Array.isArray(data.entityId)?
            data.entityId:
            [data.entityId];
        if (!entitiesId?.length) {
            return;
        }

        const tags = (!data.value)?
            []:
            Array.isArray(data.value)?
                data.value:
                [data.value];

        const serviceData = {
            attributeId: data.attributeId,
        };

        let result = 0;
        for (const entityId of entitiesId) {
            serviceData.entityId = entityId;

            const tagsId = [];
            for (const tag of tags) {
                const tagRow = await conf.eavAttributeTagService.getOrCreate({
                    attributeId: data.attributeId,
                    name: tag,
                });

                const tagId = tagRow.id;
                tagsId.push(tagId);
                serviceData.tagId = tagId;
                const rows = await this.getFor(serviceData, {...options, skipNoRowsError: true});
                if (rows?.length) {
                    continue;
                }

                await this.create(serviceData, options);
                result++;
            }

            delete serviceData.tagId;
            serviceData.notTagId = tagsId;
            result += await this.deleteFor(serviceData, {...options, where: undefined});
        }

        return result;
    }

    async delete(options) {
        const where = options.where;
        if (!where) {
            throw new Error(loc._cf('eav', 'Delete without where is forbiden.'));
        }

        const Op = this.Sequelize?.Op;
        const filters = [];

        if (where.id) {
            filters.push({id: where.id});
            delete where.id;
        }

        if (where.entityId) {
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
            filters.push({tagId: where.tagId});
            delete where.tagId;
        }

        if (where.notTagId) {
            filters.push({tagId: {[Op.notIn]: where.notTagId}});
            delete where.notTagId;
        }

        if (filters.length) {
            if (where[Op.and]) {
                filters.push(...where[Op.and]);
            }
            
            where[Op.and] = filters;
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
                entityId,
            },
        };

        if (options.includeTag === undefined) {
            options.includeTag = true;
        }

        delete options.tagAttributes;

        return this.getList(options);
    }

    async completeForEntities(entities, options) {
        if (!options.includeTag) {
            return entities;
        }

        entities = await entities;
        for (const i in entities) {
            const entity = entities[i];
            const tags = await this.getForEntityId(entity.id);
            entity.tags = tags.map(tag => tag.Tag.name);

            entities[i] = entity;
        }

        return entities;
    }

    async getForTags(tags, options) {
        return this.getList({...options, where: {...options?.where, tags}});
    }

    async getEntityIdForTags(tags, options) {
        const rows = await this.getForTags(tags, {...options, attributes: ['entityId'], raw: true, nest: true});
        const result = [];
        rows.map(rows => {
            const id = rows[this.entityId];
            if (!result.includes(id)) {
                result.push(id);
            }
        });

        return result;
    }
}