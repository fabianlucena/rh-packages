import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class EavAttribute extends sequelize.Sequelize.Model {
    static associate(models) {
      if (!models?.ModelEntityName) {
        throw new Error('There is no ModelEntityName model. Try adding RH Model Entity Name module to the project.');
      }

      if (!models?.Module) {
        throw new Error('There is no Module model. Try adding RH Module module to the project.');
      }

      this.belongsTo(models.ModelEntityName,      { foreignKey: 'modelEntityNameId' });
      this.belongsTo(models.EavAttributeType,     { foreignKey: 'typeId',        as: 'Type' });
      this.belongsTo(models.EavAttributeCategory, { foreignKey: 'categoryId',    as: 'Category',    allowNull: true });
      this.belongsTo(models.Module,               { foreignKey: 'ownerModuleId', as: 'OwnerModule', allowNull: true });
    }
  }
  EavAttribute.init({
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
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isTranslatable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    translationContext: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    modelEntityNameId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    typeId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    categoryId: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    order: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: false,
    },
    isField: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isColumn: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isDetail: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isMultiple: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isRequeired: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  }, {
    sequelize,
    timestamps: true,
    tableName: 'Attribute',
    schema: conf.schema,
  });
  return EavAttribute;
};
