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
      allowNull: true,
    },
    clientId: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    clientSecret: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    requestURL: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    getTokenURL: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    getTokenBody: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    authorizationBearerProperty: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    getUserInfoURL: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    userInfoUsernameProperty: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    userInfoDisplayNameProperty: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createUserIfNotExists: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  }, {
    sequelize,
    timestamps: true,
    freezeTableName: true,
    schema: conf.schema,
  });
  return OAuth2Client;
};
