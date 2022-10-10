const ru = require('rofa-util');
const l = ru.locale;

class NoRowsError extends Error {
    static _message = l._f('There are no "%s" for "%s" in "%s"');
    static _params = [l._f('element'), l._f('selector'), l._f('model')];

    constructor(message) {
        super();
        ru.setUpError(
            this,
            {
                message: message
            }
        );
    }
}

class ManyRowsError extends Error {
    static NoObjectValues = ['length'];
    static VisibleProperties = ['message', 'length'];
    static _message = l._f('There are many "%s" for "%s" in "%s"');
    static _params = [l._f('element'), l._f('selector'), l._f('model')];

    constructor(message, length) {
        super();
        ru.setUpError(
            this,
            {
                message: message,
                length: length
            }
        );
    }
}

class MissingPropertyError extends Error {
    static NoObjectValues = ['length'];
    static VisibleProperties = ['objectName', 'properties'];
    static _zeroMessage = l._f('No properties for object "%s"');
    static _message = l._nf(0, 'Missing property "%s" for  object "%s"', 'Missing properties "%s" for object "%s"');

    properties = [];

    constructor(objectName, ...properties) {
        super();
        ru.setUpError(
            this,
            {
                objectName: objectName,
                properties: properties,
            }
        );
    }

    _n() {return this.properties.length;}

    async getMessageParams(locale) {
        return [await locale._and(...this.properties), this.objectName];
    }
}

const sqlUtil = {
    NoRowsError: NoRowsError,
    ManyRowsError: ManyRowsError,
    MissingPropertyError: MissingPropertyError,

    skipAssociationAttributes: {attributes: []},
    skipThroughAssociationAttributes: {attributes: [], through: {attributes: []}},

    configureModels(modelsPath, sequelize) {
        if (!sequelize)
            return;

        if (modelsPath) {
            const fs = require('fs');
            const path = require('path');
            const models = {};
                
            fs
                .readdirSync(modelsPath)
                .filter(file => {
                    return (file.indexOf('.') !== 0) && (file.slice(-3) === '.js');
                })
                .forEach(file => {
                    const model = require(path.join(modelsPath, file))(sequelize, sequelize.Sequelize.DataTypes);
                    models[model.name] = model;
                });

            Object.keys(models).forEach(modelName => {
                if (models[modelName].associate) {
                    models[modelName].associate(sequelize.models);
                }
            });
        }
    },

    postConfigureModels(sequelize) {
        if (!sequelize)
            return;

        Object.keys(sequelize.models).forEach(modelName => {
            if (sequelize.models[modelName].postAssociate) {
                sequelize.models[modelName].postAssociate(sequelize.models);
            }
        });
    },

    async getSingle(rowList, options) {
        if (rowList.length == 1)
            return rowList[0];

        if (!rowList.length) {
            if (options?.skipNoRowsError)
                return;
            
            throw new sqlUtil.NoRowsError({
                message: options?.noRowsError ?? options?.error,
                _message: options?._noRowsError ?? options?._error,
                params: options?.noRowsErrorParams ?? options?.params,
                _params: options?._noRowsErrorParams ?? options?._params,
            });
        }
        
        if (options?.skipManyRowsError)
            return rowList[0];

        return new sqlUtil.ManyRowsError({
            message: options?.manyRowsError || options?.error,
            _message: options?._manyRowsError || options?._error,
            params: options?.manyRowsError ?? options?.params,
            _params: options?._manyRowsError ?? options?._params,
            length: rowList.length,
        });
    },

    /**
     * Gets a row list for a given model. Search the specified properties for its values in the model and return the matched rows.
     * @param {Sequelize.Model} model - model to query.
     * @param {{name: value, ...}} data - data to search.
     * @param {Options} options - options to pass to findAll method.
     * @returns {Promise{rows}}
     */
    getFor(model, data, options) {
        return model.findAll(ru.deepComplete(options, {where: data}));
    },

    /**
     * Gets a single row for a given model. @see sqlUtil.getFor for detail.
     * @param {Sequelize.Model} model - model to query.
     * @param {{name: value, ...}} data - data to search.
     * @param {Options} options - options to pass to findAll method.
     * @returns {Promise{row}}
     */
    async getSingleRowFor(model, data, options) {
        options = ru.deepComplete(options, {limit: 2});
        const rowList = await sqlUtil.getFor(model, data, options);
        return sqlUtil.getSingle(rowList, options);
    },

    /**
     * Gets a given properties for a single row of a given model. @see sqlUtil.getSingleRowFor for detail.
     * @param {Sequelize.Model} model - model to query.
     * @param {{name: value, ...}} data - data to search.
     * @param {string} getProperty - property name to return.
     * @param {Options} options - options to pass to findAll method.
     * @returns {Promise{row}}
     */
    async getSingleRowProperty(model, data, getProperty, options) {
        options = ru.deepComplete(options, {attributes: [getProperty]});
        const row = await sqlUtil.getSingleRowFor(model, data, options);
        return row[getProperty];
    },

    /**
     * Check for a row existence and if not exists add the row. @see sqlUtil.getSingleRowProperty for detail.
     * @param {Sequelize.Model} model - model to query.
     * @param {{name: value, ...}} data - data to search.
     * @param {string|[]string} propertyName - property name to check the existence. Can be a string for a single property name search or a properties names list.
     * @param {Options} options - options to pass to findAll method.
     * @returns {null}
     */
    async addIfNotExistsSingle(model, data, propertyName, options) {
        options = ru.complete(options, {attributes:[]});
        if (!(propertyName instanceof Array))
            propertyName = [propertyName];
        
        const searchData = {};
        await Promise.all(await propertyName.map(n => searchData[n] = data[n]));
        if (!options.attributes.length)
            options.attributes.push(propertyName[0]);

        const rows = await sqlUtil.getFor(model, searchData, options);
        if (!rows.length)
            await model.create(data);
    },

    addIfNotExists(model, propertyName, ...data) {
        if (data.length) 
            return sqlUtil.addIfNotExistsSingle(model, data.shift(), propertyName)
                .then(() => sqlUtil.addIfNotExists(model, propertyName, ...data));
        else
            return new Promise(resolve => resolve());
    },

    addIfNotExistsByName(model, ...data) {
        return sqlUtil.addIfNotExists(model, 'name', ...data);
    },

    completeAssociationOptions(base, options) {
        if (options.skipAssociationAttributes)
            ru.deepComplete(base, sqlUtil.skipAssociationAttributes);

        if (options.skipThroughAssociationAttributes)
            ru.deepComplete(base, sqlUtil.skipThroughAssociationAttributes);

        return base;
    },

    async checkDataForMissingProperties(data, objectName, ...properties) {
        const missingProperties = properties.filter(property => !data[property]);
        if (missingProperties?.length)
            throw new sqlUtil.MissingPropertyError(objectName, ...missingProperties);
    },

    async checkViewOptions(options) {
        if (!options)
            options = {};

        if (options.view) {
            if (options.include) {
                for (const include in options.include) {
                    if (!include.attributes)
                        include.attributes = [];
                }
            }
        }

        return options;
    },

    /**
     * Get the included (JOIN) from a sequelize query.
     * @param {*} options - Original options
     * @param {*} model - the model to get
     * @param {*} as - [optional] if the model has an as property and the as values needs to check.
     * @returns 
     */
    getIncludedModelOptions(options, model, as) {
        if (options?.include) {
            for (let i = 0, e = options.include.length; i < e; i++) {
                const included = options.include[i];
                if (included.model === model && (!as || as === included.as))
                    return included;
            }
        }
    },

    /**
     * Completes the include (JOIN) of a sequelize query.
     * @param {Options} options - Original options
     * @param {string} name - name of the property in options in the options.foreign[name]  property
     * @param {Options} includeOptions - options for include, this option must include the model property
     * @return {Options}
     */
    completeIncludeOptions(options, name, includeOptions) {
        if (options?.foreign && options?.foreign[name] === false)
            return options;

        let includedOptions;
        if (options.include)
            includedOptions = sqlUtil.getIncludedModelOptions(options, includeOptions.model);
        else
            options.include = [];

        if (!includedOptions) {
            includedOptions = includeOptions;
            options.include.push(includedOptions);
        } else
            includedOptions = ru.deepComplete(includedOptions, includeOptions);

        if (includeOptions.skipAssociationAttributes)
            ru.deepComplete(includedOptions, sqlUtil.skipAssociationAttributes);
        
        if (includeOptions.skipThroughAssociationAttributes)
            ru.deepComplete(includedOptions, sqlUtil.skipThroughAssociationAttributes);

        if (options?.foreign)
            ru.replace(includedOptions, options?.foreign[name]);

        return options;
    },
};

module.exports = sqlUtil;