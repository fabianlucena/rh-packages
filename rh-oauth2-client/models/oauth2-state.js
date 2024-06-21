import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class OAuth2State extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.OAuth2Client,   { as: 'oAuth2Client', foreignKey: 'oAuth2ClientId', allowNull: false });
    }
  }
  OAuth2State.init({
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
    oAuth2ClientId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    state: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  }, {
    sequelize,
    timestamps: true,
    freezeTableName: true,
    schema: conf.schema,
  });
  return OAuth2State;
};
