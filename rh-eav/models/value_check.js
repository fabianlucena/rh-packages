import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class EavValueCheck extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.EavAttribute, { as: 'attribute', foreignKey: 'attributeId' });
    }
  }
  EavValueCheck.init({
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
    value: {
      type: DataTypes.BOOLEAN,
    },
  }, {
    sequelize,
    timestamps: true,
    tableName: 'ValueCheck',
    schema: conf.schema,
  });
  return EavValueCheck;
};
