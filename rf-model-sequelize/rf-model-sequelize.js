import { Op as srvOp } from 'rf-service';
import { Op, Utils as seqUtils } from 'sequelize';
import crypto from 'crypto';

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

  constructor(model) {
    this.model = model;
  }

  getSanitizedOptions(options, service) {
    if (!options) {
      return;
    }

    const mark = crypto.createHash('md5').update(JSON.stringify(options)).digest('hex');
    if (ModelSequelize.cache[mark]) {
      return ModelSequelize.cache[mark];
    }

    const sanitizedOptions = this.sanitizeOptions(options, service);
    ModelSequelize.cache[mark] = sanitizedOptions;

    return sanitizedOptions;
  }

  sanitizeOptions(options, service) {
    options = { ...options };
    
    options.raw ??= true;
    options.nest ??= true;

    if (options.include) {
      const references = service?.references;
      if (!references) {
        throw Error('Try to perform include in a service without references.');
      }

      const includes = options.include;
      options.include = [];
      for (const includeName in includes) {
        let include = includes[includeName];
        if (include === true) {
          include = {};
        }

        include.as ??= includeName;
        if (!include.model) {
          include.model = references[includeName]?.service?.model?.model;
          if (!include.model) {
            if (!references[includeName]) {
              throw Error(`Reference for ${includeName} does not exists in ${service.constructor}.`);
            }

            if (!references[includeName].service) {
              throw Error(`Service for reference ${includeName} does not exists in ${service.constructor}.`);
            }

            if (!references[includeName].service.model) {
              throw Error(`Model for reference ${includeName} does not exists in ${service.constructor}.`);
            }

            throw Error(`Seuqelize model for reference ${includeName} does not exists in ${service.constructor}.`);
          }
        }

        if (include.where) {
          include.where = this.sanitizeWhere(include.where);
        }

        options.include.push(include);
      }
    }

    if (options.where) {
      options.where = this.sanitizeWhere(options.where);
    }

    if (options.orderBy) {
      options.order = this.sanitizeOrder(options.orderBy);
      delete options.orderBy;
    }    

    return options;
  }

  sanitizeWhere(where) {
    if (Array.isArray(where)) {
      const v = [];
      for (let i of where) {
        v.push(this.sanitizeWhere(i));
      }

      return v;
    }

    if (typeof where === 'object') {
      for (let k in where) {
        let v = where[k];
        if (typeof k === 'symbol') {
          delete where[k];

          if (!opMap[k]) {
            throw Error('Unknown symbol in query.');
          }

          k = opMap[k];
        }

        where[k] = this.sanitizeWhere(v);
      }
    }

    return where;
  }

  sanitizeOrder(options) {
    if (options.orderBy?.length) {
      options.orderBy = options.orderBy.map(orderBy => {
        let col = orderBy[0];
        const sort = orderBy[1];
        if (!(col instanceof seqUtils.Col)) {
          col = this.model.sequelize.col(col);
        }
        return [col, sort];
      });
    }

    return options;
  }

  async create(data, options, service) {
    return this.model.create(data, this.getSanitizedOptions(options, service));
  }

  async get(options, service) {
    return this.model.findAll(this.getSanitizedOptions(options, service));
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
    return this.model.transaction();
  }
}