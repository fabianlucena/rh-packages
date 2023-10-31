import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class Tag extends sequelize.Sequelize.Model {
        static associate(models) {
            this.belongsTo(models.TagCategory, {foreignKey: 'tagCategoryId'});
            this.belongsTo(models.Module,      {foreignKey: 'ownerModuleId', as: 'OwnerModule', allowNull: true});
        }
    }
    Tag.init({
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
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    }, {
        sequelize,
        timestamps: true,
        freezeTableName: true,
        schema: conf.schema,
    });
    return Tag;
};
