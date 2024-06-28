import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class SessionData extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.Session, { foreignKey: 'sessionId' });
    }
  }
  SessionData.init({
    sessionId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
    },
    jsonData: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    data: {
      type: DataTypes.VIRTUAL,
      get() {
        const jsonData = this.getDataValue('jsonData');
        if (!jsonData) {
          return null;
        }

        return JSON.parse(jsonData);
      },
      set(data) {
        const jsonData = JSON.stringify(data) ?? null;
                
        this.setDataValue('jsonData', jsonData);
      }
    },
  }, {
    sequelize,
    timestamps: true,
    freezeTableName: true,
    schema: conf.schema,
  });
  return SessionData;
};
