import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class EavValueTag extends sequelize.Sequelize.Model {
        static associate(models) {
            this.belongsTo(models.EavAttribute,    {foreignKey: 'attributeId'});
            this.belongsTo(models.EavAttributeTag, {foreignKey: 'attributeTagId'});
        }
    }
    EavValueTag.init({
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
        entityId: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        attributeId: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        attributeTagId: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
    }, {
        sequelize,
        timestamps: true,
        tableName: 'ValueTag',
        schema: conf.schema,
    });
    return EavValueTag;
};
