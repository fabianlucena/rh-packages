import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class OAuth2Client extends sequelize.Sequelize.Model {
  }
  OAuth2Client.init({
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
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isTranslatable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    projectId: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    clientId: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    clientSecret: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    requestUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  }, {
    sequelize,
    timestamps: true,
    freezeTableName: true,
    schema: conf.schema,
  });
  return OAuth2Client;
};
