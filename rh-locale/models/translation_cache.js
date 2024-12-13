import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class TranslationCache extends sequelize.Sequelize.Model {
  }
  TranslationCache.init({
    language: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    domain: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    context: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    source: {
      type: DataTypes.TEXT,
      allowNull: false,
      ... (sequelize.getDialect() === 'mysql' && { collate: 'utf8_bin' }),
      ... (sequelize.getDialect() === 'postgres' && { collate: 'POSIX' }),
      ... (sequelize.getDialect() === 'mssql' && { collate: 'SQL_Latin1_General_CP1_CS_AS' })
    },
    isJson: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    translation: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    ref: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isTranslated: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    isDraft: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
  }, {
    sequelize,
    timestamps: true,
    freezeTableName: true,
    schema: conf.schema,
  });
  return TranslationCache;
};
