import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class EavAttributeOption extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.EavAttributeCategory, { foreignKey: 'categoryId',    as: 'Category' });
      this.belongsTo(models.Module,               { foreignKey: 'ownerModuleId', as: 'OwnerModule', allowNull: true });
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
  }, {
    sequelize,
    timestamps: true,
    tableName: 'AttributeOption',
    schema: conf.schema,
  });
  return EavAttributeOption;
};
