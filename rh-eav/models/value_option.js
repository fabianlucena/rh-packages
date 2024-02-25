import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class EavValueOption extends sequelize.Sequelize.Model {
        static associate(models) {
            if (!models?.ModelEntityName) {
                throw new Error('There is no ModelEntityName model. Try adding RH Model Entity Name module to the project.');
            }

            this.belongsTo(models.ModelEntityName,    {foreignKey: 'modelEntityNameId'});
            this.belongsTo(models.EavAttribute,       {foreignKey: 'attributeId'});
            this.belongsTo(models.EavAttributeOption, {foreignKey: 'attributeOptionId'});
        }
    }
    EavValueOption.init({
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
        modelEntityNameId: {
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
        attributeOptionId: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
    }, {
        sequelize,
        timestamps: true,
        tableName: 'ValueOption',
        schema: conf.schema,
    });
    return EavValueOption;
};
