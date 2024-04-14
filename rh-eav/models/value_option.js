import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class EavValueOption extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.EavAttribute,       { foreignKey: 'attributeId' });
      this.belongsTo(models.EavAttributeOption, { foreignKey: 'optionId',  as: 'Option' });
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
    attributeId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    entityId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    optionId: {
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
