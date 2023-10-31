import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class Page extends sequelize.Sequelize.Model {
        static associate(models) {
            this.belongsTo(models.Module,     {foreignKey: 'ownerModuleId', as: 'OwnerModule', allowNull: true});
            this.belongsTo(models.Language,   {foreignKey: 'languageId',                       allowNull: true});
            this.belongsTo(models.PageFormat, {foreignKey: 'formatId',      as: 'Format',      allowNull: false});

        }

        static postAssociate(models) {
            this.hasMany(models.Share, {as: 'Collaborators', foreignKey: 'objectId'});
        }
    }
    Page.init({
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
        isTranslatable: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        translationContext: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        title: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    }, {
        sequelize,
        timestamps: true,
        freezeTableName: true,
        schema: conf.schema
    });
    return Page;
};
