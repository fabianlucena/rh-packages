import { dependency } from 'rf-dependency';
import { CheckError, NoSharedObjectError, NoSharedServiceError } from './rf-service-errors.js';

export const ServiceMixinShared = Service => class ServiceShared extends Service {
  init() {
    super.init();

    this.shareObject ??= this.Name;
    this.shareService ??= dependency.get('shareService');
  }

  prepareReferences() {
    if (!this.references.owner) {
      this.references.owner = { service: 'shareService' };
    }

    if (!this.references.share) {
      this.references.share = true;
    }

    super.prepareReferences();
  }

  async validateForCreation(data) {
    if (!data.owner && !data.ownerId && !this.skipNoOwnerCheck) {
      throw new CheckError(loc => loc._('No owner specified.'));
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
      await this.emit('creating', options?.emitEvent, data, options, this);
      const row = await super.create(data, { ...options, emitEvent: false });
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

      await this.emit('created', options?.emitEvent, row, data, options, this);

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
    if (!this.shareObject) {
      throw new NoSharedObjectError(loc => loc._(
        'No shareObject defined in %s.',
        this.constructor.name,
      ));
    }

    if (!this.shareService) {
      throw new NoSharedServiceError(loc => loc._(
        'No shareService defined in %s.',
        this.constructor.name,
      ));
    }

    if (!data.userId && !data.user) {
      return;
    }

    return this.shareService.create({ objectName: this.shareObject, ...data }, options);
  }

  async getListOptions(options) {
    if (options?.include?.owner) {
      let ownerOptions = options.include.owner;
      if (ownerOptions === true || typeof options.include.owner !== 'object') {
        ownerOptions = {};
      }

      options = {
        ...options,
        include: {
          ...options?.include,
          owner: {
            attributes: [],
            ...ownerOptions,
            include: {
              objectName: {
                required: false,
                attributes: [],
                where: { name: this.shareObject ?? this.name },
              },
              type: {
                required: false,
                attributes: [],
                where: { name: 'owner' },
              },
              user: {
                required: false,
                attributes: ['uuid', 'userName', 'displayName'],
              },
            },
          },
        },
      };

      if (options.where?.shareType !== undefined) {
        options.include.owner.include.shareType.where.name = options.where.shareType;
        delete options.where.shareType;
      }

      const isEnabled = options.isEnabled ?? options.where?.isEnabled;
      if (isEnabled !== undefined) {
        options.include.owner.include.user.where.isEnabled = isEnabled;
        options.include.owner.include.shareType.where.isEnabled = isEnabled;
        options.include.owner.where.isEnabled = isEnabled;
      }
    }

    return super.getListOptions(options);
  }

  /**
   * Deletes a row for a given criteria.
   * @param {object} where - Where object with the criteria to delete.
   * @returns {Promise[integer]} deleted rows count.
   */
  async delete(options) {
    options = { ...options };        
    options.where = await this.completeReferences(options.where);

    if (this.shareService && this.shareObject) {
      const id = await this.getIdFor(options.where);
      await this.shareService.deleteForModelEntityNameAndId(this.shareObject, id);
    }

    return super.delete(options);
  }
};