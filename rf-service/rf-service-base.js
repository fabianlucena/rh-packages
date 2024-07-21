import { Op, Column } from './rf-service-op.js';
import { NoRowsError, ManyRowsError, ReferenceDefinitionError, QueryError } from './rf-service-errors.js';
import { ucfirst, lcfirst } from 'rf-util/rf-util-string.js';
import { trim } from 'rf-util';
import dependency from 'rf-dependency';

/**
 * A number, or a string containing a number.
 * @typedef {object} GetOptions
 */

export class ServiceBase {
  hiddenColumns = [];

  /**
   * List of columns that together make up a unique multivalued key
   */
  uniqueColumns = undefined;

  /**
   * Here are specified the references for properties. The references have the form propertyName: options.
   * {
   *  user: {
   *      service: conf.global.services.User,
   *      name: 'username',
   *  },
   *  site: conf.global.services.Site,
   * }
   * 
   * The options for each reference are:
   *  - idPropertyName: the name for ID property to use in reference and in the data set. If this options is not defined a "reference name + 'Id'" will be used".
   *  - service: the service to get the value of the reference.
   *  - uuidPropertyName: the name for UUID property to get the reference from the service. If this options is not defined a "reference name + 'Uuid'" will be used".
   *  - name: the name form the property and for search in the service.
   *  - Name: the name for the nested object in the data set. In this object the search of: ID, UUID, and name will be performed.
   *  - otherName: another name for te property name to search in the service.
   *  - createIfNotExists: if it's true and no object ID founded, the system will create with a create if not exists.
   *  - getIdForName: method name for get the ID from name from the service.
   *  - extern: true when the reference is external, useful for one to many relationships
   *  - externIdPropertyName: the name for ID property in the extern table for the property reference. If this options is not defined a "this service name + 'Id'" will be used".
   *  - through: service for use as interposed table for many to many relationships
   *  - idThroughLocal: the name for ID property in the interposed table to reference this table. If this options is not defined a "this service name + 'Id'" will be used".
   *  - idThroughReference: the name for ID property in the interposed table to reference the foreign table. If this options is not defined a "reference name + 'Id'" will be used".
   * 
   * For each reference a check for idPropertyName is performed. If the idPropertyName is not defined, the system will try to get the ID from the service using the uuidPropertyName.
   * If the uuidPropertyName is not defined the the system will try to use the "name" in the service. 
   * But if the "name" is not defined the "Name" as nested object, looking for the Name.id, Name.uuid, or Name.name.  
   * If all of the previous alternatives fail, and the otherName is defined an attempt to looking for name = otherName in the service will be running.
   * If the reference ID is still missing and createIfNotExists is true, the system will try to create the referenced object using:
   *  - the data[Name] object as the first try,
   *  - the {name: data.name} object as the second try, and
   *  - the {name: data.otherName} object as the third and final try.
   * 
   * If all of above fails the reference ID will be not completed.
   */
  references = {};

  /**
   * Holds a list of error for this instance.
   * Warning, if this is a singleton, this list contains error for all of the threads.
   */
  lastErrors = [];

  /**
   * Gets always the same instance of the service.
   * @returns {ServiceBase}
   */
  static singleton() {
    if (!this.singletonInstance) {
      this.singletonInstance = this.factory();
    }

    return this.singletonInstance;
  }

  /**
   * Creates a new instance for the service.
   * @returns {ServiceBase}
   */
  static factory() {
    const service = new this();
    if (!this.singletonInstance) {
      this.singletonInstance = service;
    }

    service.init();
    return service;
  }

  init() {
    if (typeof this.Name === 'undefined') {
      this.Name = this.constructor.name;
      if (this.Name.endsWith('Service')) {
        this.Name = this.Name.substring(0, this.Name.length - 7);
      }
    }

    if (typeof this.name === 'undefined') {
      this.name = this.Name[0].toLowerCase() + this.Name.slice(1);
    }

    if (typeof this.model === 'undefined') {
      this.model = this.name + 'Model';
    }

    if (typeof this.model === 'string') {
      this.model = dependency.get(this.model);
    }

    this.defaultTranslationContext ??= this.name;
    this.eventName ??= this.Name;

    if (this.eventBus === true) {
      this.eventBus = dependency.get('eventBus');
    }

    this.prepareReferences();
  }

  prepareReferences() {
    for (const name in this.references) {
      let reference = this.references[name];
      if (reference === true) {
        reference = {
          service: name.slice(0, 1).toLowerCase() + name.slice(1) + 'Service',
        };
        this.references[name] = reference;
      } else if (typeof reference === 'string' || typeof reference === 'function') {
        reference = {
          service: reference,
        };
        this.references[name] = reference;
      }
                
      if (typeof reference !== 'object') {
        throw new ReferenceDefinitionError(loc => loc._c(
          'service',
          'Error in reference definition for reference name "%s", in service "%s".',
          name,
          this.constructor.name
        ));
      }

      if (reference.function) {
        continue;
      }

      if (reference instanceof ServiceBase) {
        reference = { service: reference };
        this.references[name] = reference;
      }

      if (!reference.service) {
        reference.service = name + 'Service';
      }

      if (typeof reference.service === 'string') {
        let serviceName = reference.service;
        let service = dependency.get(serviceName, null);
        if (!service) {
          if (!serviceName.endsWith('Service')) {
            service = dependency.get(serviceName + 'Service', null);
          }

          if (!service) {
            if (!reference.optional) {
              throw new ReferenceDefinitionError(loc => loc._c(
                'service',
                'Error service name "%s", not found for reference "%s" in service "%s".',
                serviceName,
                name,
                this.constructor.name
              ));
            }

            continue;
          }
        }

        reference.service = service;
      }

      if (reference.service.singleton) {
        reference.service = reference.service.singleton();
      } else if (reference.service.creator) {
        reference.service = reference.service.creator();
      } else if (typeof reference.service === 'function') {
        reference.service = new reference.service();
      }

      reference.name ??= name;
      reference.Name ??= ucfirst(reference.name);
      reference.idPropertyName ??=   lcfirst(reference.name) + 'Id';
      reference.uuidPropertyName ??= lcfirst(reference.name) + 'Uuid';
      reference.namePropertyName ??= lcfirst(reference.name) + 'Name';
      reference.getIdForName ??= 'getIdOrNullForName';
      reference.getIdForUuid ??= 'getIdOrNullForUuid';

      if (reference.extern) {
        reference.externIdPropertyName ??= this.name + 'Id';
      }

      if (reference.createIfNotExists === true) {
        reference.createIfNotExists = 'createIfNotExists';
      }

      if (!reference.otherName && reference.name !== name) {
        reference.otherName = name;
      }

      if (reference.through) {
        if (typeof reference.through === 'string') {
          reference.through = { service: reference.through };
        }
        const through = reference.through;

        if (typeof through.service === 'string') {
          let serviceName = through.service;
          let service = dependency.get(serviceName, null);
          if (!service) {
            if (!serviceName.endsWith('Service')) {
              service = dependency.get(serviceName + 'Service', null);
            }

            if (!service) {
              if (!reference.optional) {
                throw new ReferenceDefinitionError(loc => loc._c(
                  'service',
                  'Error service name "%s", not found for reference through "%s" in service "%s".',
                  serviceName,
                  name,
                  this.constructor.name
                ));
              }

              continue;
            }
          }

          through.service = service;
        }

        through.idLocalPropertyName ??= reference.idThroughLocal ?? ( this.name + 'Id');
        through.idReferencePropertyName ??= reference.idThroughReference ?? ( reference.service.name + 'Id');
      }

      delete reference.idThroughLocal;
      delete reference.idThroughReference;
    }
  }

  /**
   * Gets always the same instance of the service.
   * @param {*} error - the error to store.
   * @returns {*}
   */
  async pushError(error) {
    this.lastErrors.push(error);

    return error;
  }

  async emit(eventSubName, condition, result, ...params) {
    if (condition !== false && this.eventBus && this.eventName) {
      let result1 = await this.eventBus?.$emit(this.eventName + '.' + eventSubName, result, ...params) ?? [];
      let result2 = await this.eventBus?.$emit(eventSubName, this.eventName, result, ...params) ?? [];
      return [...result1, ...result2];
    }
  }

  /**
   * Creates a new transaction for use in queries.
   * @returns {Transaction}
   */
  async createTransaction() {
    return this.model.createTransaction(this);
  }
    
  /**
   * Completes the references for a data and cleans the value referenced data.
   * @param {object} data - data object to complete the references.
   * @returns {Promise[object]} - the arranged data.
   */
  async completeReferences(data) {
    data = { ...data };
    for (const name in this.references) {
      const reference = this.references[name];

      if (reference.extern || reference.through) {
        continue;
      }

      if (reference.function) {
        await reference.function(data);
        continue;
      }

      if (!reference.service) {
        continue;
      }

      await this.completeEntityId(data, { name, ...reference });
    }

    return data;
  }

  /**
   * Complete the reference ID for a single entity.
   * @param {object} data - data object to complete the references.
   * @param {object} options - configuration for the search and complete the entity ID.
   * @returns {Promise[object]} - the arranged data.
   * 
   * This method is used by the @see completeReferences.
   * For a complete guide refer to @see references documentation.
   * When the reference ID is completes the data is cleaned for old data.
   */
  async completeEntityId(data, reference) {
    const idPropertyName = reference.idPropertyName;
    const uuidPropertyName = reference.uuidPropertyName;
    const namePropertyName = reference.namePropertyName;
    const service = reference.service;
    const name = reference.name;
    const Name = reference.Name;
    const otherName = reference.otherName;
    const getIdForUuid = reference.getIdForUuid;
    const getIdForName = reference.getIdForName;
    if (!data[idPropertyName]) {
      if (data[name]?.id) {
        data[idPropertyName] = data[name].id;
      } else if (data[uuidPropertyName] && service[getIdForUuid]) {
        data[idPropertyName] = await service[getIdForUuid](data[uuidPropertyName]);
      } else if (data[name]?.uuid && service[getIdForUuid]) {
        data[idPropertyName] = await service[getIdForUuid](data[name].uuid);
      } else if (data[namePropertyName] && service[getIdForName]) {
        data[idPropertyName] = await service[getIdForName](data[uuidPropertyName]);
      } else if (data[name]?.name && service[getIdForName]) {
        data[idPropertyName] = await service[getIdForName](data[name].name);
      } else if (data[name] && typeof data[name] === 'string' && service[getIdForName]) {
        data[idPropertyName] = await service[getIdForName](data[name], { skipNoRowsError: true });
      } else if (data[name] && typeof data[name] === 'object' && !Array.isArray(data[name])) {
        const childData = data[name];
        if (childData.id) {
          data[idPropertyName] = childData.id;
        } else if (childData.uuid && service[getIdForUuid]) {
          data[idPropertyName] = await service[getIdForUuid](childData.uuid);
        } else if (childData.name && service[getIdForName]) {
          data[idPropertyName] = await service[getIdForName](childData.name);
        }
      }

      if (!data[idPropertyName]) {
        if (otherName && typeof data[otherName] === 'string' && data[otherName] && service[getIdForName]) {
          data[idPropertyName] = await service[getIdForName](data[otherName], { skipNoRowsError: true });
        }

        if (!data[idPropertyName] && reference.createIfNotExists) {
          let object;
          if (typeof data[name] === 'object' && data[name]) {
            object = await service[reference.createIfNotExists](data[name]);
          } else if (typeof data[name] === 'string' && data[name]) {
            object = await service[reference.createIfNotExists]({ name: data[name] });
          } else if (typeof data[Name] === 'object' && data[Name]) {
            object = await service[reference.createIfNotExists](data[Name]);
          } else if (typeof data[Name] === 'string' && data[Name]) {
            object = await service[reference.createIfNotExists]({ name: data[Name] });
          } else if (typeof data[otherName] === 'string' && data[otherName]) {
            object = await service[reference.createIfNotExists]({ name: data[otherName] });
          }

          if (object) {
            data[idPropertyName] = object?.id;
          } else {
            let list;
            if (Array.isArray(data[Name]) && data[Name].length) {
              list = data[Name];
            } else if (Array.isArray(data[name]) && data[name].length) {
              list = data[name];
            } else if (Array.isArray(data[otherName]) && data[otherName].length) {
              list = data[otherName];
            }

            if (list?.length) {
              const id = [];
              for (const item of list) {
                id.push((await service[reference.createIfNotExists]({ name: item })).id);
              }
                            
              data[idPropertyName] = id;
            }
          }
        }
      }
    }

    if (!data[idPropertyName]
      && (data[uuidPropertyName]
        || data[Name]
        || data[name]
      )
    ) {
      throw new NoRowsError(loc => loc._c(
        'service',
        'Cannot find the ID for reference "%s", in service "%s" for value: "%s".',
        name,
        this.name,
        data[uuidPropertyName] ?? JSON.stringify(data[name]) ?? JSON.stringify(data[Name]),
      ));
    }

    delete data[uuidPropertyName];
    delete data[Name];
    delete data[name];
        
    return data;
  }

  /**
   * Performs the necessary validations.
   * @param {object} data - data to update in entity.
   * @param {string} operation - any of values: creation, update or delete.
   * @returns {Promise[data]} - the data.
   */
  // eslint-disable-next-line no-unused-vars
  async validate(data, operation) {
    return trim(data);
  }

  /**
   * Performs the necessary validations before creation.
   * @param {object} data - data to update in entity.
   * @returns {Promise[data]} - the data.
   */
  async validateForCreation(data) {
    return this.validate(data, 'creation');
  }

  /**
   * Creates a new row into DB.
   * @param {object} data - data for the new row.
   * @param {object} options - options to pass to creator, for use transaction.
   * @returns {Promise[row]}
   */
  async create(data, options) {
    data = await this.completeReferences(data, options);
    data = await this.validateForCreation(data);

    let transaction;
    if (options?.transaction || this.transaction) {
      if (options.transaction === true || !options.transaction) {
        options.transaction = transaction = await this.createTransaction();
      }
    }

    try {
      await this.emit('creating', options?.emitEvent, data, options, this);
      let row = await this.model.create(data, options, this);
      await this.updateExternData({ ...data, ...row }, options);
      await this.updateThroughData({ ...data, ...row }, options);
      await this.emit('created', options?.emitEvent, row, data, options, this);

      await transaction?.commit();

      if (this.dto) {
        row = new this.dto(row);
      }
    
      return row;
    } catch (error) {
      await transaction?.rollback();

      await this.pushError(error);

      throw error;
    }
  }

  async updateExternData(data, options) {
    if (options?.skipUpdateExtern) {
      return;
    }

    for (const referenceName in this.references) {
      const reference = this.references[referenceName],
        extern = reference.extern;
      if (!extern) {
        continue;
      }

      let referenceDataList = data[referenceName];
      if (referenceDataList) {
        if (!Array.isArray(referenceDataList)) {
          referenceDataList = [ referenceDataList ];
        }
      } else {
        referenceDataList = [];
      }

      let localIds = data.id;
      if (!localIds) {
        if (!options.where) {
          throw new ReferenceDefinitionError(loc => loc._c(
            'service',
            'Cannot update referenced data "%s", because cannot get ID for local rows (where clause is lost) in service "%s".',
            referenceName,
            this.name
          ));
        }

        localIds = await this.getIdFor(options.where);
        if (!localIds.length) {
          continue;
        }
      } else if (!Array.isArray(localIds)) {
        localIds = [ localIds ];
      }

      const queryOptions = { transaction: options.transaction };
      for (const localId of localIds) {
        const referenceIds = [];
        for (const referenceData of referenceDataList) {
          const thisData = {
            ...referenceData,
            [reference.externIdPropertyName]: localId,
          };
          const row = await reference.service.findOrCreate(thisData, queryOptions);
          referenceIds.push(row.id);
        }

        if (!options?.skipDeleteExtern) {
          await reference.service.deleteFor(
            {
              [reference.externIdPropertyName]: localId,
              id: { [Op.notIn]: referenceIds },
            },
            queryOptions
          );
        }
      }
    }
  }

  async updateThroughData(data, options) {
    if (options?.skipUpdateExtern) {
      return;
    }

    for (const referenceName in this.references) {
      const reference = this.references[referenceName],
        through = reference.through;
      if (!through || !data[reference.idPropertyName]) {
        continue;
      }

      let referenceIds = data[reference.idPropertyName];
      if (!Array.isArray(referenceIds)) {
        referenceIds = [ referenceIds ];
      }

      let localIds = data.id;
      if (!localIds) {
        if (!options.where) {
          throw new ReferenceDefinitionError(loc => loc._c(
            'service',
            'Cannot update referenced data "%s", because cannot get ID for local rows (where clause is lost) in service "%s".',
            referenceName,
            this.name
          ));
        }

        localIds = await this.getIdFor(options.where);
        if (!localIds.length) {
          continue;
        }
      } else if (!Array.isArray(localIds)) {
        localIds = [ localIds ];
      }

      const queryOptions = { transaction: options.transaction };
      for (const localId of localIds) {
        for (const referenceId of referenceIds) {
          const thisData = {
            [through.idLocalPropertyName]: localId,
            [through.idReferencePropertyName]: referenceId,
          };
          await through.service.createIfNotExists(thisData, queryOptions);
        }

        if (!options?.skipDeleteExtern) {
          await through.service.deleteFor(
            {
              [through.idLocalPropertyName]: localId,
              [through.idReferencePropertyName]: { [Op.notIn]: referenceIds },
            }, { transaction: options.transaction }
          );
        }
      }
    }
  }
  
  isIncludedColumn(columnName) {
    if (typeof columnName !== 'string' || !columnName.includes('.')) {
      return true;
    }

    const columnNameParts = columnName.split('.');
    const tableName = columnNameParts[0];
    const reference = this.references[tableName];
    if (!reference) {
      return false;
    }

    if (columnNameParts.length === 2) {
      return true;
    }

    const includedColumnName = columnNameParts.slice(1).join('.');

    return reference.service.isIncludedColumn(includedColumnName);
  }

  arrangeSearchColumns(options) {
    options = { ...options };

    if (!options.q) {
      return options;
    }

    const searchColumns = options.searchColumns ?? this.searchColumns;    
    if (!searchColumns) {
      return options;
    }

    const q = `%${options.q}%`;
    const qColumns = [];
    for (let searchColumn of searchColumns) {
      if (typeof searchColumn === 'string'
        && searchColumn.includes('.')
        && this.isIncludedColumn(searchColumn)
      ) {
        searchColumn = '$' + searchColumn + '$';
      }

      qColumns?.push({ [searchColumn]: { [Op.like]: q }});
    }

    if (qColumns.length) {
      if (!options.where) {
        options.where = { [Op.and]: [] };
      } else if (!options.where[Op.and]) {
        options.where[Op.and] = [];
      }

      options.where[Op.and].push({ [Op.or]: qColumns });
    }

    return options;
  }

  /**
   * Gets the options to use in getList methods.
   * @param {object} options - options for the getList method.
   * @returns {Promise[object]}
   * 
   * Common properties:
   * - view: show visible properties.
   */
  async getListOptions(options) {
    if (options?.arranged) {
      return options;
    }

    options = { ...options };

    if (options.include) {
      options.include = { ...options.include };
    }

    if (options.where && this.references && Object.keys(this.references).length) {
      options.where = { ...options.where };
      for (const key in options.where) {
        if (typeof key === 'string') {
          let include = options.include?.[key];
          if (include) {
            if (include === true) {
              include = {};
              options.include[key] = include;
            }
          } else if (this.references[key]) {
            include = { attributes: [] };
            options.include ??= [];
            options.include[key] = include;
          }

          if (include) {
            let value = options.where[key];
            const reference = this.references[key];
            if (reference.whereColumn) {
              if (typeof value === 'string'
                || Array.isArray(value)
              ) {
                value = { [reference.whereColumn]: value };
              } else if (typeof value === 'object') {
                const keys = Object.keys(value);
                if (keys.length === 1 && typeof keys[0] !== 'string') {
                  value = { [reference.whereColumn]: value };
                }
              }
            } else if (typeof value === 'string'
              || Array.isArray(value)
            ) {
              throw new ReferenceError(loc => loc._c(
                'service',
                'Invalid value "%s" for referenced where, where column is not defined, in reference "%s", in service "%s".',
                JSON.stringify(value),
                key,
                this.name,
              ));
            }

            if (!include.where) {
              include.where = value;
            } else {
              include.where = {
                [Op.and]: [
                  include.where,
                  value,
                ],
              };
            }

            delete options.where[key];
          }
        }
      }
    }

    const includes = options.include;
    if (includes) {
      for (const includedName in includes) {
        let include = includes[includedName];
        if (include === undefined || include === null) {
          delete includes[includedName];
          continue;
        } else if (include === true) {
          include = {};
        } else if (include === false) {
          include = { attributes: [] };
        }

        const reference = this.references[includedName];
        if (!reference) {
          throw new ReferenceDefinitionError(loc => loc._c(
            'service',
            'Can\'t include "%s" because is not reference in service "%s".',
            includedName,
            this.constructor.name
          ));
        }

        if (reference?.service) {
          if (include.attributes === false) {
            include.attributes = [];
          }

          if (!include.attributes && reference.attributes) {
            include.attributes = reference.attributes;
          }
          
          include = await reference.service.getListOptions({ isEnabled: options.isEnabled, ...include });
        }

        includes[includedName] = include;
      }
    }

    options = this.arrangeSearchColumns(options);

    if (options.view && this.viewAttributes?.length) {
      options.attributes ??= [];
      options.attributes.push(...this.viewAttributes.filter(a => !options.attributes.includes(a)));
    }

    if (options.orderBy?.length) {
      options.orderBy = options.orderBy.map(orderBy => {
        let orderByParts;
        if (Array.isArray(orderBy)) {
          orderByParts = orderBy;
        } else if (typeof orderBy === 'string') {
          const parts = orderBy.split(' ');
          orderByParts = [parts.slice(0, -1).join(' '), parts.slice(-1)[0]];
        } else if (typeof orderBy === 'object') {
          const keys = Object.keys(orderBy);
          if (keys.length > 1) {
            throw new QueryError(loc => loc._c('service', 'Unknown order by option format for: "%s". It must be string, two items array, or a single property object.', orderBy));
          }
          orderByParts = [keys[1], orderBy[keys[1]]];
        }

        if (orderByParts.length > 2) {
          throw new QueryError(loc => loc._c('service', 'Unknown order by option format for: "%s". It must be string, two items array, or a single property object.', orderBy));
        }
        let column = orderByParts[0];
        const sort = orderByParts[1] ?? 'ASC';
        if (Column.isColumn(column)) {
          column = Column(column);
        }
        return [column, sort];
      });
    }

    options.arranged = true;

    return options;
  }

  /**
   * Gets a list of rows.
   * @param {object} options - options for get the list of data.
   * @returns {Promise<row[]>}
   */
  async getList(options) {
    options = await this.getListOptions(options);
    await this.emit('getting', options?.emitEvent, options, this);
    let result = this.model.get(options, this);
    if (!options) {
      result = await result;
      if (this.dto) {
        result = result.map(r => new this.dto(r));
      }
    } else if (this.dto) {
      result = await result;
      result = result.map(r => new this.dto(r));
    }
    await this.emit('getted', options?.emitEvent, result, options, this);

    return result;
  }

  async getOrCreate(data, options) {
    const result = await this.getSingleFor(data, { skipNoRowsError: true, ...options });
    if (result) {
      return result;            
    }

    return this.create(data, options);
  }

  /**
   * Gets a list of rows and the total rows count.
   * @param {GetOptions} options - options for the getList and count methods, used in getListOptions method.
   * @returns {Promise<{rows: Object[], count: number}]}
   */
  async getListAndCount(options) {
    options = await this.getListOptions(options);
    const rows = await this.getList(options);
    const count = await this.count(options);

    return { rows, count };
  }

  /**
   * Gets a single row from a row list. If there are no rows or are many rows 
   * this function fails.
   * @param {Array[row]} rows - row list 
   * @param {object} options 
   * @returns row
   * 
   * For an empty list this function throw a NoRowsError exception. But the 
   * exception is skipped if the option skipNoRowsError is specified.
   * 
   * For a list with more than a item a ManyRowsError exception will be thrown.
   * This behavior can be skipped with option skipManyRowsError.
   * 
   * Options: 
   * - skipNoRowsError: if is true the exception NoRowsError will be omitted and return undefined.
   * - nullOnManyRowsError: : if is true the exception ManyRowsError will be omitted and returns undefined.
   * - skipManyRowsError: if is true the exception ManyRowsError will be omitted and returns the first row.
   */
  async getSingleFromRows(rows, options) {
    if (rows.then) {
      rows = await rows;
    }

    if (rows.length === 1) {
      return rows[0];
    }

    if (!rows.length) {
      if (options?.skipNoRowsError) {
        return;
      }
            
      throw new NoRowsError();
    }

    if (options?.nullOnManyRowsError) {
      return;
    }
        
    if (options?.skipManyRowsError) {
      return rows[0];
    }

    throw new ManyRowsError({ length: rows.length });
  }

  /**
   * Gets a row for a given criteria.
   * @param {object} where - criteria to get the row list (where object).
   * @param {object} options - Options for the @ref getList method.
   * @returns {Promise[Array[row]]}
   */
  async getFor(where, options) {
    return this.getList({ ...options, where: { ...options?.where, ...where }});
  }

  /**
   * Gets a single row for a given criteria in options.
   * @param {object} options - Options for the @ref getList function.
   * @returns {Promise[row]}
   */
  async getSingle(options) {
    const rows = await this.getList({ limit: 2, ...options });
    return this.getSingleFromRows(rows, options);
  }

  async getFirst(options) {
    const rows = await this.getList({ limit: 1, ...options });
    if (!rows?.length) {
      return;
    }

    return rows[0];
  }

  /**
   * Gets a single row for a given criteria.
   * @param {object} where - criteria to get the row list (where object).
   * @param {object} options - Options for the @ref getList function.
   * @returns {Promise[row]}
   */
  async getSingleFor(where, options) {
    return this.getSingle({ ...options, where: { ...options?.where, ...where }});
  }

  /**
   * Gets a single row for a given criteria or null if not exists.
   * @param {object} where - criteria to get the row list (where object).
   * @param {object} options - Options for the @ref getList function.
   * @returns {Promise[row]}
   */
  async getSingleOrNullFor(where, options) {
    return this.getSingleOrNull({ ...options, where: { ...options?.where, ...where }});
  }

  async getSingleOrNull(options) {
    return this.getSingle({ ...options, skipNoRowsError: true, nullOnManyRowsError: true });
  }

  async getFirstOrNullFor(where, options) {
    return this.getFirst({ ...options, where: { ...options?.where, ...where }});
  }

  async count(options) {
    options = await this.getListOptions(options);
    options = { ...options, include: { ...options?.include }};
    options.attributes = [];
    if (options.include) {
      for (var includedName in options.include) {
        options.include[includedName].attributes = [];
      }
    }
        
    await this.emit('gettingCount', options?.emitEvent, options);
    const result = await this.model.count(options, this);
    await this.emit('gettingCount', options?.emitEvent, result, options);

    return result;
  }

  async countFor(where, options) {
    return this.count({ ...options, where: { ...options?.where, ...where }});
  }

  /**
   * Performs the necessary validations before updating.
   * @param {object} data - data to update in entity.
   * @returns {Promise[data]} - the data.
   */
  async validateForUpdate(data, where) {
    return this.validate(data, 'update', where);
  }

  /**
   * Updates rows for options.
   * @param {object} data - Data to update.
   * @param {object} options - object with the where property for criteria to update and the transaction object.
   * @returns {Promise[integer]} updated rows count.
   */
  async update(data, options) {
    data = await this.completeReferences(data, options);
    data = await this.validateForUpdate(data, options?.where);

    await this.emit('updating', options?.emitEvent, data, options, this);
    let result = await this.model.update(data, options, this);
    if (result.length) {
      result = result[0];
    }
    await this.updateExternData(data, options);
    await this.updateThroughData(data, options);
    await this.emit('updated', options?.emitEvent, result, data, options, this);

    return result;
  }

  /**
   * Updates row for a criteria.
   * @param {object} data - Data to update.
   * @param {object} where - where object with the criteria to update.
   * @param {object} options - object for transaction.
   * @returns {Promise[integer]} updated rows count.
   */
  async updateFor(data, where, options) {
    return this.update(data, { ...options, where: { ...options?.where, ...where }});
  }

  /**
   * Deletes rows for options.
   * @param {object} options - object with the where property for criteria to delete and the transaction object.
   * @returns {Promise[integer]} deleted rows count.
   */
  async delete(options) {
    options = { ...options };
    options.where = await this.completeReferences(options.where);

    await this.emit('deleting', options?.emitEvent, options, this);
    const result = await this.model.delete(options, this);
    await this.emit('deleted', options?.emitEvent, result, options, this);

    return result;
  }

  /**
   * Deletes rows for a criteria.
   * @param {object} where - where object with the criteria to delete.
   * @param {object} options - object for transaction.
   * @returns {Promise[integer]} deleted rows count.
   */
  async deleteFor(where, options) {        
    return this.delete({ ...options, where: { ...options?.where, ...where }});
  }

  async sanitize(result, options) {
    if (result.rows) {
      await this.emit('sanitizing', options?.emitEvent, result.rows, options, this);
      result.rows = await Promise.all(result.rows.map(row => this.sanitizeRow(row, options)));
      const eventResult = await this.emit('sanitized', options?.emitEvent, result.rows, options, this);
      if (eventResult?.length) {
        result.rows = eventResult[eventResult.length - 1];
      }
    } else {
      await this.emit('sanitizing', options?.emitEvent, result, options, this);
      result = await Promise.all(result.map(row => this.sanitizeRow(row, options)));
      const eventResult = await this.emit('sanitized', options?.emitEvent, result, options, this);
      if (eventResult?.length) {
        result = eventResult[eventResult.length - 1];
      }
    }

    return result;
  }

  async sanitizeRow(row, options) {
    await this.emit('sanitizingRow', options?.emitEvent, row, options, this);

    if (this.hiddenColumns?.length) {
      row = { ...row };
      for (const hideColumn of this.hiddenColumns) {
        delete row[hideColumn];
      }
    }

    for (const referenceName in this.references) {
      const reference = this.references[referenceName];
      if (!reference) {
        continue;
      }

      let service = reference;
      if (!service?.sanitizeRow) {
        if (reference.service) {
          service = reference.service;
        }

        if (!service?.sanitizeRow) {
          continue;
        }
      }
            
      let name = referenceName;
      if (!row[name]) {
        name = service.constructor?.name;
        if (name.endsWith('Service')) {
          name = name.substring(0, name.length - 7);
        }

        if (!row[name]) {
          continue;
        }
      }

      if (Array.isArray(row[name])) {
        if (service.sanitize) {
          row[name] = await service.sanitize(row[name], options);
        }
      } else {
        if (service.sanitizeRow) {
          row[name] = await service.sanitizeRow(row[name], options);
        }
      }
    }

    await this.emit('sanitizedRow', options?.emitEvent, row, options, this);

    return row;
  }

  async findOrCreate(data, options) {
    data = await this.completeReferences(data, options);
    options = { ...options };
    if (!options.where) {
      if (data.id) {
        options.where = { id: data.id };
      } if (this.uniqueColumns) {
        options.where = {};
        for (const columnName of this.uniqueColumns) {
          options.where[columnName] = data[columnName];
        }
      } else {
        options.where = { ...data };
      }
    }

    let row = await this.getSingle({ ...options, skipNoRowsError: true });
    if (row) {
      await this.updateExternData({  ...data, ...row }, options);
      await this.updateThroughData({ ...data, ...row }, options);
      return [row, false];
    }

    row = await this.create(data, options);
    return [row, true];
  }

  async createIfNotExists(data, options) {
    const [, created] = await this.findOrCreate(data, options);
    return created;
  }

  async createOrUpdate(data, options) {
    options = { ...options };
    let updateData;
    if (!options.where) {
      if (data.id) {
        options.where = { id: data.id };
        updateData = { ...data, id: undefined };
      } else if (data.uuid) {
        options.where = { uuid: data.uuid };
        updateData = { ...data, uuid: undefined };
      } else if (data.name) {
        options.where = { name: data.name };
        updateData = { ...data, name: undefined };
      } else {
        throw new QueryError('No criteria for find the row.');
      }
    }

    let row = await this.getSingle({ ...options, skipNoRowsError: true });
    if (row) {
      await this.update(updateData, options);
      return [row, false];
    }

    row = await this.create(data);
    return [row, true];
  }
}