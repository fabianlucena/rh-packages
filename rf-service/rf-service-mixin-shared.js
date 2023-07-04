'use strict';

export const ServiceMixinShared = Service => class ServiceShared extends Service {
    /**
     * Creates a new row into DB.
     * @param {object} data - data for the new row.
     * @returns {Promise[row]}
     */
    async create(data, options) {
        const addShare = this.shareObject && this.shareService && (data.ownerId || data.owner);
        if (addShare) {
            options ??= {};
            options.transaction ||= true;
        }

        let transaction;
        if (options?.transaction) {
            if (options.transaction === true)
                options.transaction = transaction = await this.createTransaction();
        }

        try {
            const row = await super.create(data, options);
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

            await transaction?.commit();

            return row;
        } catch (error) {
            await transaction?.rollback();

            this.pushError(error);

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

        return this.shareService.create(data, options);
    }
};