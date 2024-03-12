import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class EavAttributeCategory extends sequelize.Sequelize.Model {
    }
    EavAttributeCategory.init({
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
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        isTranslatable: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        translationContext: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    }, {
        sequelize,
        timestamps: true,
        tableName: 'AttributeCategory',
        schema: conf.schema,
    });
    return EavAttributeCategory;
};
