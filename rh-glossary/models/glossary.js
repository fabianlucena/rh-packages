import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class Glossary extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.Module,   { as: 'ownerModule', foreignKey: 'ownerModuleId' });
    }
  }
  Glossary.init({
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    sequelize,
    timestamps: true,
    tableName: 'Glossary',
    schema: conf.schema,
  });
  return Glossary;
};
