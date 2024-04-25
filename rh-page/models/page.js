import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class Page extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.Module,     { as: 'ownerModule', foreignKey: 'ownerModuleId' });
      this.belongsTo(models.PageFormat, { as: 'format',      foreignKey: 'formatId' });
      this.belongsTo(models.Language,   { as: 'language',    foreignKey: 'languageId' });
    }

    static postAssociate(models) {
      this.hasMany(models.Share, { as: 'collaborators', foreignKey: 'objectId' });
    }
  }
  Page.init({
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
      unique: true,
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
    title: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    ownerModuleId: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
  }, {
    sequelize,
    timestamps: true,
    freezeTableName: true,
    schema: conf.schema
  });
  return Page;
};
