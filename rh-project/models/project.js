'use strict';

import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class Project extends sequelize.Sequelize.Model {
        static associate(models) {
            this.belongsTo(models.Company, {foreignKey: 'companyId'});
        }

        static postAssociate(models) {
            this.hasMany(models.Share, {as: 'Collaborators', foreignKey: 'objectId'});
        }
    }
    Project.init({
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            unique: true,
        },
        uuid: {
            type: DataTypes.UUID,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
            unique: true,
        },
        isEnabled: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        isTranslatable: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        companyId: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
    }, {
        sequelize,
        timestamps: true,
        freezeTableName: true,
        schema: conf.schema,
    });
    return Project;
};
