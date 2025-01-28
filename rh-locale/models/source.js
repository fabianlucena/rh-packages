import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class Source extends sequelize.Sequelize.Model {
  }
  Source.init({
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
    isJson: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
      ... (sequelize.getDialect() === 'mysql' && { collate: 'utf8_bin' }),
      ... (sequelize.getDialect() === 'postgres' && { collate: 'POSIX' }),
      ... (sequelize.getDialect() === 'mssql' && { collate: 'SQL_Latin1_General_CP1_CS_AS' })
    },
    ref: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    sequelize,
    timestamps: true,
    freezeTableName: true,
    schema: conf.schema,
  });
  return Source;
};
