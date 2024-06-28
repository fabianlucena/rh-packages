import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class EavAttributeOption extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.EavAttributeCategory, { as: 'category',    foreignKey: 'categoryId' });
      this.belongsTo(models.Module,               { as: 'ownerModule', foreignKey: 'ownerModuleId' });
    }
  }
  EavAttributeOption.init({
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
    categoryId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    ownerModuleId: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
  }, {
    sequelize,
    timestamps: true,
    tableName: 'AttributeOption',
    schema: conf.schema,
  });
  return EavAttributeOption;
};
