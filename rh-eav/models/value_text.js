import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class EavValue extends sequelize.Sequelize.Model {
        static associate(models) {
            this.belongsTo(models.EavEntityType, {foreignKey: 'entityTypeId'});
            this.belongsTo(models.EavAttribute,  {foreignKey: 'attributeId'});
        }
    }
    EavValue.init({
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
        entityTypeId: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        entityId: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        attributeId: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        value: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    }, {
        sequelize,
        timestamps: true,
        tableName: 'ValueText',
        schema: conf.schema,
    });
    return EavValue;
};
