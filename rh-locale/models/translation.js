import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class Translation extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.Source,   { as: 'source',   foreignKey: 'sourceId' });
      this.belongsTo(models.Language, { as: 'language', foreignKey: 'languageId' });
      this.belongsTo(models.Domain,   { as: 'domain',   foreignKey: 'domainId' });
      this.belongsTo(models.Context,  { as: 'context',  foreignKey: 'contextId' });
    }
  }
  Translation.init({
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
    isDraft: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isJson: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sourceId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    languageId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    domainId: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    contextId: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
  }, {
    sequelize,
    timestamps: true,
    freezeTableName: true,
    schema: conf.schema
  });
  return Translation;
};
