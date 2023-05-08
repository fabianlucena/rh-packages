import {setUpError, deepComplete, replace} from 'rf-util';
import {loc} from 'rf-locale';
import fs from 'fs';
import path from 'path';
import {Op} from 'sequelize';

export class NoRowsError extends Error {
    static _message = loc._f('There are no "%s" for "%s" in "%s"');
    static _params = [loc._f('element'), loc._f('selector'), loc._f('model')];

    constructor(message) {
        super();
        setUpError(
            this,
            {
                message
            }
        );
    }
}

export class ManyRowsError extends Error {
    static NoObjectValues = ['length'];
    static VisibleProperties = ['message', 'length'];
    static _message = loc._f('There are many "%s" for "%s" in "%s"');
    static _params = [loc._f('element'), loc._f('selector'), loc._f('model')];

    constructor(message, length) {
        super();
        setUpError(
            this,
            {
                message,
                length
            }
        );
    }
}

export class MissingPropertyError extends Error {
    static NoObjectValues = ['length'];
    static VisibleProperties = ['objectName', 'properties'];
    static _zeroMessage = loc._f('No properties for object "%s"');
    static _message = loc._nf(0, 'Missing property "%s" for  object "%s"', 'Missing properties "%s" for object "%s"');

    properties = [];

    constructor(objectName, ...properties) {
        super();
        setUpError(
            this,
            {
                objectName,
                properties,
            }
        );
    }

    _n() {return this.properties.length;}

    async getMessageParamsAsync(loc) {
        return [await loc._and(...this.properties), this.objectName];
    }
}

export const skipAssociationAttributes = {attributes: []};
export const skipThroughAssociationAttributes = {attributes: [], through: {attributes: []}};

export async function configureModelsAsync(modelsPath, sequelize) {
    if (!sequelize)
        return;

    if (!modelsPath)
        return;
        
    if (!fs.existsSync(modelsPath))
        throw new Error(`The modules path does not exists: ${modelsPath}`);

    await Promise.all(
        await fs
            .readdirSync(modelsPath)
            .filter(file => (file.indexOf('.') !== 0) && (file.slice(-3) === '.js'))
            .map(async file => (await import('file://' + path.join(modelsPath, file))).default(sequelize, sequelize.Sequelize.DataTypes))
    );
}

export async function posConfigureModelsAssociationsAsync(sequelize) {
    if (!sequelize)
        return;
        
    await Promise.all(
        await Object.keys(sequelize.models).map(async modelName => {
            if (sequelize.models[modelName].associate) {
                sequelize.models[modelName].associate(sequelize.models);
            }
        })
    );
}

export function postConfigureModels(sequelize) {
    if (!sequelize)
        return;

    Object.keys(sequelize.models).forEach(modelName => {
        if (sequelize.models[modelName].postAssociate) {
            sequelize.models[modelName].postAssociate(sequelize.models);
        }
    });
}

export async function getSingle(rowList, options) {
    if (rowList.length == 1)
        return rowList[0];

    if (!rowList.length) {
        if (options?.skipNoRowsError)
            return;
        
        throw new NoRowsError({
            message: options?.noRowsError ?? options?.error,
            _message: options?._noRowsError ?? options?._error,
            params: options?.noRowsErrorParams ?? options?.params,
            _params: options?._noRowsErrorParams ?? options?._params,
            statusCode: 404
        });
    }
    
    if (options?.skipManyRowsError)
        return rowList[0];

    return new ManyRowsError({
        message: options?.manyRowsError || options?.error,
        _message: options?._manyRowsError || options?._error,
        params: options?.manyRowsError ?? options?.params,
        _params: options?._manyRowsError ?? options?._params,
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
    return model.findAll({where: data, ...options});
}

/**
 * Gets a single row for a given model. @see getFor for detail.
 * @param {Sequelize.Model} model - model to query.
 * @param {{name: value, ...}} data - data to search.
 * @param {Options} options - options to pass to findAll method.
 * @returns {Promise{row}}
 */
export async function getSingleRowFor(model, data, options) {
    options = deepComplete(options, {limit: 2});
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
    options = deepComplete(options, {attributes: [getProperty]});
    const row = await getSingleRowFor(model, data, options);
    return row[getProperty];
}

export function completeAssociationOptions(base, options) {
    if (options.skipAssociationAttributes)
        deepComplete(base, skipAssociationAttributes);

    if (options.skipThroughAssociationAttributes)
        deepComplete(base, skipThroughAssociationAttributes);

    return base;
}

export async function checkDataForMissingProperties(data, objectName, ...properties) {
    const missingProperties = properties.filter(property => !data[property]);
    if (missingProperties?.length)
        throw new MissingPropertyError(objectName, ...missingProperties);
}

export async function checkViewOptions(options) {
    if (!options)
        options = {};

    if (options.view) {
        if (options.include) {
            options.include = await options.include.map(include => {
                if (!include.attributes)
                    include.attributes = [];

                return include;
            });
        }
    }

    return options;
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
            if (included.model === model && (!as || as === included.as))
                return included;
        }
    }
}

/**
 * Completes the include (JOIN) of a sequelize query.
 * @param {Options} options - Original options
 * @param {string} name - name of the property in options in the options.foreign[name]  property
 * @param {Options} includeOptions - options for include, this option must include the model property
 * @return {Options}
 */
export function completeIncludeOptions(options, name, includeOptions) {
    if (options?.foreign && options?.foreign[name] === false)
        return options;

    let includedOptions;
    if (options.include)
        includedOptions = getIncludedModelOptions(options, includeOptions.model);
    else
        options.include = [];

    if (!includedOptions) {
        includedOptions = includeOptions;
        options.include.push(includedOptions);
    } else
        includedOptions = deepComplete(includedOptions, includeOptions);

    if (includeOptions.skipAssociationAttributes)
        deepComplete(includedOptions, skipAssociationAttributes);
    
    if (includeOptions.skipThroughAssociationAttributes)
        deepComplete(includedOptions, skipThroughAssociationAttributes);

    if (options?.foreign)
        replace(includedOptions, options?.foreign[name]);

    return options;
}

export function addEnabledFilter(options) {
    if (!options)
        options = {};

    if (!options.where)
        options.where = {};
            
    if (!options.where.isEnabled === undefined)
        options.where.isEnabled = options.isEnabled ?? true;

    return options;
}

export function addEnabledOnerModuleFilter(options) {
    options = completeIncludeOptions(
        options,
        'ownerModule',
        {
            where: {
                [Op.or]: [
                    {ownerModuleId: {[Op.eq]: null}},
                    {isEnabled: {[Op.eq]: options?.isEnabled ?? true}},
                ],
            }
        }
    );
    
    return options;
}

export function addEnabledWithOnerModuleFilter(options) {
    options = addEnabledFilter(options);
    options = addEnabledOnerModuleFilter(options);

    return options;
}