import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class Share extends sequelize.Sequelize.Model {
    static associate(models) {
      if (!models?.ModelEntityName) {
        throw new Error('There is no ModelEntityName model. Try adding RH Model Entity Name module to the project.');
      }

      this.belongsTo(models.ModelEntityName, { as: 'objectName',  foreignKey: 'objectNameId', onDelete: 'cascade' });
      this.belongsTo(models.User,            { as: 'user',        foreignKey: 'userId',       onDelete: 'cascade' });
      this.belongsTo(models.ShareType,       { as: 'type',        foreignKey: 'typeId' });
      this.belongsTo(models.Module,          { as: 'ownerModule', foreignKey: 'ownerModuleId' });
    }
  }
  Share.init({
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
    objectNameId: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    objectId: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    typeId: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    ownerModuleId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
  }, {
    sequelize,
    timestamps: true,
    freezeTableName: true,
    schema: conf.schema
  });
  return Share;
};
