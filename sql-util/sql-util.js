import { ModelSequelize } from 'rf-model-sequelize';
import { deepComplete, replace, BaseError } from 'rf-util';
import dependency from 'rf-dependency';
import fs from 'fs';
import path from 'path';

export class NoRowsError extends BaseError {
  message = async loc => loc._(
    'There are no "%s" for "%s" in "%s"',
    await loc._('items'),
    await loc._('selector'),
    await loc._('model'),
  );

  constructor(message) {
    super({ message });
  }
}

export class ManyRowsError extends BaseError {
  static noObjectValues = ['length'];
  static visibleProperties = ['message', 'title', 'length'];
  message = async loc => loc._(
    'There are many "%s" (%s) for "%s" in "%s"',
    await loc._('items'),
    await loc.number(length),
    await loc._('selector'),
    await loc._('model'),
  );

  constructor(message, length) {
    super({ message, length });
  }
}

export class MissingPropertyError extends BaseError {
  static noObjectValues = ['length'];
  static visibleProperties = ['objectName', 'properties'];
  message = async loc => loc._nn(
    this.properties.length,
    'No properties for object "%s"',
    'Missing property "%s" for  object "%s"',
    'Missing properties "%s" for object "%s"',
    await loc._('objectName'),
    await loc._('modepropertiesl'),
  );

  properties = [];

  constructor(objectName, ...properties) {
    super({ objectName, properties });
  }
}

export const skipAssociationAttributes = { attributes: [] };
export const skipThroughAssociationAttributes = { attributes: [], through: { attributes: [] }};

export async function configureModels(modelsPath, sequelize) {
  if (!sequelize) {
    return;
  }

  if (!modelsPath) {
    return;
  }
        
  if (!fs.existsSync(modelsPath)) {
    throw new Error(`The modules path does not exists: ${modelsPath}`);
  }

  await Promise.all(
    await fs
      .readdirSync(modelsPath)
      .filter(file => (file.indexOf('.') !== 0) && (file.slice(-3) === '.js'))
      .map(async file => {
        const model = (await import('file://' + path.join(modelsPath, file))).default(sequelize, sequelize.Sequelize.DataTypes);
        if (model.prototype instanceof sequelize.Sequelize.Model) {
          let modelName = model.name[0].toLowerCase() + model.name.slice(1) + 'Model';
          dependency.addStatic(modelName, new ModelSequelize(model, sequelize));
        }
      })
  );
}

export async function posConfigureModelsAssociations(sequelize) {
  if (!sequelize) {
    return;
  }
        
  await Promise.all(
    await Object.keys(sequelize.models).map(async modelName => {
      if (sequelize.models[modelName].associate) {
        sequelize.models[modelName].associate(sequelize.models);
      }
    })
  );
}

export function postConfigureModels(sequelize) {
  if (!sequelize) {
    return;
  }

  Object.keys(sequelize.models).forEach(modelName => {
    if (sequelize.models[modelName].postAssociate) {
      sequelize.models[modelName].postAssociate(sequelize.models);
    }
  });
}

export async function getSingle(rowList, options) {
  if (rowList.length == 1) {
    return rowList[0];
  }

  if (!rowList.length) {
    if (options?.skipNoRowsError) {
      return;
    }
        
    throw new NoRowsError({
      message: options?.noRowsError ?? options?.error,
      params: options?.noRowsErrorParams ?? options?.params,
      statusCode: 404
    });
  }
    
  if (options?.skipManyRowsError) {
    return rowList[0];
  }

  return new ManyRowsError({
    message: options?.manyRowsError || options?.error,
    params: options?.manyRowsError ?? options?.params,
    length: rowList.length,
  });
}

/**
 * Gets a row list for a given model. Search the specified properties for its values in the model and return the matched rows.
 * @param {Sequelize.Model} model - model to query.
 * @param {{name: value, ...}} data - data to search.
 * @param {Options} options - options to pass to findAll method.
 * @returns {Promise{rows}}
 */
export function getFor(model, data, options) {
  return model.findAll({ where: data, ...options });
}

/**
 * Gets a single row for a given model. @see getFor for detail.
 * @param {Sequelize.Model} model - model to query.
 * @param {{name: value, ...}} data - data to search.
 * @param {Options} options - options to pass to findAll method.
 * @returns {Promise{row}}
 */
export async function getSingleRowFor(model, data, options) {
  options = deepComplete(options, { limit: 2 });
  const rowList = await getFor(model, data, options);
  return getSingle(rowList, options);
}

/**
 * Gets a given properties for a single row of a given model. @see getSingleRowFor for detail.
 * @param {Sequelize.Model} model - model to query.
 * @param {{name: value, ...}} data - data to search.
 * @param {string} getProperty - property name to return.
 * @param {Options} options - options to pass to findAll method.
 * @returns {Promise{row}}
 */
export async function getSingleRowProperty(model, data, getProperty, options) {
  options = deepComplete(options, { attributes: [getProperty] });
  const row = await getSingleRowFor(model, data, options);
  return row[getProperty];
}

export function completeAssociationOptions(base, options) {
  if (options.skipAssociationAttributes) {
    deepComplete(base, skipAssociationAttributes);
  }

  if (options.skipThroughAssociationAttributes) {
    deepComplete(base, skipThroughAssociationAttributes);
  }

  return base;
}

export async function checkDataForMissingProperties(data, objectName, ...properties) {
  const missingProperties = properties.filter(property => !data[property]);
  if (missingProperties?.length) {
    throw new MissingPropertyError(objectName, ...missingProperties);
  }

  return true;
}

/**
 * Get the included (JOIN) from a sequelize query.
 * @param {*} options - Original options
 * @param {*} model - the model to get
 * @param {*} as - [optional] if the model has an as property and the as values needs to check.
 * @returns 
 */
export function getIncludedModelOptions(options, model, as) {
  if (options?.include) {
    for (let i = 0, e = options.include.length; i < e; i++) {
      const included = options.include[i];
      if (included.model === model && (!as || as === included.as)) {
        return included;
      }
    }
  }
}

/**
 * Completes the include (JOIN) of a sequelize query.
 * @param {Options} options - Original options
 * @param {string} name - name of the property in options in the options.foreign[name]  property
 * @param {Options} includeOptions - options for include, this option must include the model property
 * @param {Options} includeDefaultOptions - options for include, this options are use as default for those that are not defined in the includetOptions
 * @return {Options}
 */
export function completeIncludeOptions(options, name, includeOptions, includeDefaultOptions) {
  if (options?.foreign && options?.foreign[name] === false) {
    return options;
  }

  if (typeof includeOptions !== 'object' || !includeOptions) {
    includeOptions = {};
  }
        
  if (includeDefaultOptions) {
    includeOptions = { ...includeDefaultOptions, ...includeOptions };
  }

  let includedOptions;
  if (options.include) {
    includedOptions = getIncludedModelOptions(options, includeOptions.model, includeOptions.as);
  } else {
    options.include = [];
  }

  if (!includedOptions) {
    includedOptions = includeOptions;
    options.include.push(includedOptions);
  } else {
    includedOptions = deepComplete(includedOptions, includeOptions);
  }

  if (includeOptions.skipAssociationAttributes) {
    deepComplete(includedOptions, skipAssociationAttributes);
  }
    
  if (includeOptions.skipThroughAssociationAttributes) {
    deepComplete(includedOptions, skipThroughAssociationAttributes);
  }

  if (options?.foreign) {
    replace(includedOptions, options?.foreign[name]);
  }

  return options;
}
