import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class Identity extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.User,         { foreignKey: 'userId', allowNull: false, onDelete: 'cascade' });
      this.belongsTo(models.IdentityType, { foreignKey: 'typeId', allowNull: false });
    }
  }
  Identity.init({
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
    isEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    typeId: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    data: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    timestamps: true,
    freezeTableName: true,
    schema: conf.schema
  });
  return Identity;
};
