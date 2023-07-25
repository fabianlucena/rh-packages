'use strict';

export const ServiceMixinShared = Service => class ServiceShared extends Service {
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
            if (options.transaction === true || !options.transaction)
                options.transaction = transaction = await this.createTransaction();
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

            if (options?.emitEvent !== false && this.eventBus && this.eventName)
                await this.eventBus?.$emit(this.eventName + '.created', row, data, options);

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
        if (!this.shareObject || !this.shareService || (!data.userId && !data.user))
            return;

        return this.shareService.create({objectName: this.shareObject, ...data}, options);
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