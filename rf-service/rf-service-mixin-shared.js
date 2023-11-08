import {includeCollaborators} from 'sql-util';
import {CheckError} from 'rf-util';
import {loc} from 'rf-locale';

export const ServiceMixinShared = Service => class ServiceShared extends Service {
    async validateForCreation(data) {
        if (!data.owner && !data.ownerId && !this.skipNoOwnerCheck) {
            throw new CheckError(loc._f('No owner specified.'));
        }

        return super.validateForCreation(data);
    }

    /**
     * Creates a new row into DB.
     * @param {object} data - data for the new row.
     * @returns {Promise[row]}
     */
    async create(data, options) {
        const addShare = data.ownerId || data.owner;
        if (addShare) {
            options ??= {};
            options.transaction ||= true;
        }

        let transaction;
        if (options?.transaction || this.transaction) {
            if (options.transaction === true || !options.transaction) {
                options.transaction = transaction = await this.createTransaction();
            }
        }

        try {
            const row = await super.create(data, {...options, emitEvent: false});
            if (addShare) {
                await this.addCollaborator(
                    {
                        objectId: row.id,
                        userId: data.ownerId,
                        user: data.owner,
                        type: 'owner',
                    },
                    options
                );
            }

            if (options?.emitEvent !== false && this.eventBus && this.eventName) {
                await this.eventBus?.$emit(this.eventName + '.created', row, data, options);
            }

            await transaction?.commit();

            return row;
        } catch (error) {
            await transaction?.rollback();

            await this.pushError(error);

            throw error;
        }
    }

    /**
     * Add a collaborator for a object ID.
     * @param {object} data - ID for the collaborator.
     * @param {object} transaction - transaction object.
     * @returns {Promise[row]}
     */
    async addCollaborator(data, options) {
        if (!this.shareObject || !this.shareService || (!data.userId && !data.user)) {
            return;
        }

        return this.shareService.create({objectName: this.shareObject, ...data}, options);
    }

    /**
     * Gets the options for use in the getList and getListAndCount methods.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - includeOwner: for owners inclusion.
     * @returns {options}
     */
    async getListOptions(options) {
        if (options?.includeOwner) {
            includeCollaborators(options, 'Scenario', this.models, {filterType: 'owner'});
            delete options.includeOwner;
        }

        return super.getListOptions(options);
    }

    /**
     * Deletes a row for a given criteria.
     * @param {object} where - Where object with the criteria to delete.
     * @returns {Promise[integer]} deleted rows count.
     */
    async delete(options) {        
        await this.completeReferences(options.where, true);

        if (this.shareService && this.shareObject) {
            const id = await this.getIdFor(options.where);
            await this.shareService.deleteForObjectNameAndId(this.shareObject, id);
        }

        return super.delete(options);
    }
};