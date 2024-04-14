import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class ModelEntityName extends sequelize.Sequelize.Model {
  }

  ModelEntityName.init({
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      unique: true
    },
    uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      unique: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    }
  }, {
    sequelize,
    timestamps: true,
    freezeTableName: true,
    schema: conf.schema
  });
  return ModelEntityName;
};
