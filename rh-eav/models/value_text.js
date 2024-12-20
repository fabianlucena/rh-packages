import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class EavValueText extends sequelize.Sequelize.Model {
    static associate(models) {
      if (!models?.ModelEntityName) {
        throw new Error('There is no ModelEntityName model. Try adding RH Model Entity Name module to the project.');
      }
      
      this.belongsTo(models.EavAttribute, { as: 'attribute', foreignKey: 'attributeId' });
      this.belongsTo(models.ModelEntityName, { as: 'modelEntityName', foreignKey: 'modelEntityNameId' });
    }
  }
  EavValueText.init({
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
    modelEntityNameId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    value: {
      type: DataTypes.TEXT,
    },
  }, {
    sequelize,
    timestamps: true,
    tableName: 'ValueText',
    schema: conf.schema,
  });
  return EavValueText;
};
