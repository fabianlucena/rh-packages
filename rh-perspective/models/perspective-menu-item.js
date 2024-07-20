import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class PerspectiveMenuItem extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.Module,      { as: 'ownerModule', foreignKey: 'ownerModuleId' });
      this.belongsTo(models.Perspective, { as: 'perspective', foreignKey: { name: 'perspectiveId', allowNull: false }});
    }
  }
  PerspectiveMenuItem.init({
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
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    sequelize,
    timestamps: true,
    tableName: 'MenuItem',
    schema: conf.schema,
  });
  return PerspectiveMenuItem;
};
