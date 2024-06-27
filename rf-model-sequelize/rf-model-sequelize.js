import { Op as srvOp } from 'rf-service';
import { Op, Utils as seqUtils } from 'sequelize';
// import crypto from 'crypto';

const opMap = {
  [srvOp.eq]:            Op.eq,
  [srvOp.ne]:            Op.ne,
  [srvOp.is]:            Op.is,
  [srvOp.isNot]:         Op.isNot,
  [srvOp.gt]:            Op.gt,
  [srvOp.gte]:           Op.gte,
  [srvOp.lt]:            Op.lt,
  [srvOp.lte]:           Op.lte,
  [srvOp.between ]:      Op.between,
  [srvOp.notBetween]:    Op.notBetween,
  [srvOp.in]:            Op.in,
  [srvOp.notIn]:         Op.notIn,
  [srvOp.like]:          Op.like,
  [srvOp.notLike]:       Op.notLike,
  [srvOp.iLike]:         Op.iLike,
  [srvOp.notILike]:      Op.notILike,
  [srvOp.regexp]:        Op.regexp,
  [srvOp.notRegexp]:     Op.notRegexp,
  [srvOp.iRegexp]:       Op.iRegexp,
  [srvOp.notIRegexp]:    Op.notIRegexp,
  [srvOp.startsWith]:    Op.startsWith,
  [srvOp.endsWith]:      Op.endsWith,
  [srvOp.notStartsWith]: Op.notStartsWith,
  [srvOp.notEndsWith]:   Op.notEndsWith,
  [srvOp.contains]:      Op.contained,
  [srvOp.overlap]:       Op.overlap,
  [srvOp.adjacent ]:     Op.adjacent ,
  [srvOp.strictLeft]:    Op.strictLeft,
  [srvOp.strictRight]:   Op.strictRight,
  [srvOp.noExtendRight]: Op.noExtendRight,
  [srvOp.noExtendLeft]:  Op.noExtendLeft,
  [srvOp.anyKeyExists ]: Op.anyKeyExists,
  [srvOp.allKeysExist ]: Op.allKeysExist,
  [srvOp.match ]:        Op.match,
  [srvOp.all ]:          Op.all,
  [srvOp.any ]:          Op.any,
  [srvOp.values ]:       Op.values,
  [srvOp.and]:           Op.and,
  [srvOp.or]:            Op.or,
  [srvOp.not]:           Op.not,
};

export class ModelSequelize {
  static cache = {};

  constructor(model, sequelize) {
    this.model = model;
    this.sequelize = sequelize;
  }

  getSanitizedOptions(options, service) {
    if (!options) {
      return;
    }

    /*
    JSON.stringify does not work because the symbols based keys.
    const mark = crypto.createHash('md5').update(JSON.stringify(options)).digest('hex');
    if (ModelSequelize.cache[mark]) {
      return ModelSequelize.cache[mark];
    }*/

    const sanitizedOptions = this.sanitizeOptions(options, service);
    //ModelSequelize.cache[mark] = sanitizedOptions;

    return sanitizedOptions;
  }

  sanitizeOptions(options, service, conf) {
    const references = service?.references;
    const sanitizedOptions = {};

    for (const k of ['attributes', 'transaction', 'limit', 'offset', ...conf?.moreValidOptions ?? []]) {
      if (options[k] === undefined) {
        continue;
      }

      sanitizedOptions[k] = options[k];
    }

    if (sanitizedOptions.attributes === true) {
      delete sanitizedOptions.attributes;
    }

    // Extract where includes
    if (options.where) {
      const where = { ...options.where };
      sanitizedOptions.where = {};

      if (references && Object.keys(references).length) {
        for (const referenceName in references) {
          for (const key in where) {
            if (references[key]) {
              continue;
            }

            if (key.startsWith(referenceName + '.')) {
              const newKey = key.substring(referenceName.length + 1);
              if (where[referenceName]) {
                where[referenceName] = {
                  [Op.and]: [
                    where[referenceName],
                    { [newKey]: where[key] },
                  ],
                };
              } else {
                where[referenceName] = { [newKey]: where[key] };                
              }

              delete where[key];
            }
          }
        }

        for (const key in where) {
          if (typeof key !== 'string') {
            continue;
          }

          let include = options.include?.[key];
          if (include) {
            if (include === true) {
              include = {};
              options.include[key] = include;
            }
          } else if (references[key]) {
            include = { attributes: [] };
            options.include ??= [];
            options.include[key] = include;
          }

          if (!include) {
            continue;
          }

          if (!include.where) {
            include.where = where[key];
          } else {
            include.where = {
              [srvOp.and]: [
                include.where,
                where[key],
              ],
            };
          }

          delete where[key];
        }
      }
      
      sanitizedOptions.where = this.sanitizeWhere(where);
    }

    if (options.include) {
      if (!references) {
        throw Error(`Try to include in service "${service.constructor.name}" without references.`);
      }

      const includes = options.include;
      sanitizedOptions.include ??= [];
      for (const includeName in includes) {
        const reference = references[includeName];
        if (!reference) {
          throw Error(`Reference does not exist for include "${includeName}" in service "${service.constructor.name}".`);
        }

        let include = includes[includeName];
        if (include === true) {
          include = {};
        } else if (!include) {
          include = { attributes: [] };
        }

        const sanitizedInclude = reference.service.model.sanitizeOptions(include, reference.service, { moreValidOptions: ['as', 'required'] });

        sanitizedInclude.model = include.model ?? reference.service?.model?.model;
        if (!sanitizedInclude.model) {
          if (!references[includeName]) {
            throw Error(`Reference for "${includeName}" does not exists in service "${service.constructor.name}".`);
          }

          if (!references[includeName].service) {
            throw Error(`Service for reference "${includeName}" does not exists in service "${service.constructor.name}".`);
          }

          if (!references[includeName].service.model) {
            throw Error(`Model for reference "${includeName}" does not exists in service "${service.constructor.name}".`);
          }

          throw Error(`Sequelize model for reference "${includeName}" does not exists in service "${service.constructor.name}".`);
        }

        sanitizedInclude.as ??= includeName;

        if (this.model.associations[includeName].through) {
          sanitizedInclude.through = { attributes: [] };
        }

        sanitizedOptions.include.push(sanitizedInclude);
      }
    }

    if (options.orderBy) {
      sanitizedOptions.order = this.sanitizeOrder(options.orderBy);
    }

    if (options.groupBy) {
      sanitizedOptions.group = this.sanitizeGroup(options.groupBy);
    }

    return sanitizedOptions;
  }

  sanitizeWhere(where) {
    if (Array.isArray(where)) {
      const newList = [];
      for (let i of where) {
        newList.push(this.sanitizeWhere(i));
      }

      return newList;
    }

    if (where && typeof where === 'object') {
      const newWhere = {};
      const symbols = Object.getOwnPropertySymbols(where);
      for (let k of symbols) {
        let v = where[k];
        k = opMap[k];
        if (!k) {
          throw Error('Unknown symbol in query.');
        }

        newWhere[k] = this.sanitizeWhere(v);
      }

      for (let k in where) {
        newWhere[k] = this.sanitizeWhere(where[k]);
      }

      return newWhere;
    }

    return where;
  }

  sanitizeOrder(orderBy) {
    if (!orderBy?.length) {
      return;
    }

    const order = orderBy.map(item => {
      let col = item[0];
      const sort = item[1];
      if (!(col instanceof seqUtils.Col)) {
        col = this.model.sequelize.col(col);
      }
      return [col, sort];
    });
  
    return order;
  }

  sanitizeGroup(groupBy) {
    if (!groupBy?.length) {
      return;
    }

    const group = groupBy.map(col => {
      if (!(col instanceof seqUtils.Col)) {
        col = this.model.sequelize.col(col);
      }
      return col;
    });
  
    return group;
  }

  async create(data, options, service) {
    return this.model.create(data, this.getSanitizedOptions(options, service));
  }

  async get(options, service) {
    const sanitizedOptions = this.getSanitizedOptions(options, service);
    let rows = await this.model.findAll(sanitizedOptions);
    if (!sanitizedOptions.raw) {
      rows = rows.map(r => r.toJSON());
    }

    return rows;
  }

  async update(data, options, service) {
    return this.model.update(data, this.getSanitizedOptions(options, service));
  }

  async delete(options, service) {
    return this.model.destroy(this.getSanitizedOptions(options, service));
  }

  async count(options, service) {
    return this.model.count(this.getSanitizedOptions(options, service));
  }

  async createTransaction() {
    return this.sequelize.transaction();
  }

  async query(query) {
    return this.sequelize.query(query);
  }
}