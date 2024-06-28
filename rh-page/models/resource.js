import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class Resource extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.ResourceType, { as: 'type', foreignKey: 'typeId',   allowNull: false });
      if (models.Language) {
        this.belongsTo(models.Language,   { as: 'language', foreignKey: 'languageId', allowNull: true });
      }
    }

    static postAssociate(models) {
      this.hasMany(models.Share, { as: 'share', foreignKey: 'objectId' });
    }
  }
  Resource.init({
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
      type: DataTypes.TEXT,
      allowNull: true,
    },
    content: {
      type: DataTypes.BLOB,
      allowNull: false,
    },
  }, {
    sequelize,
    timestamps: true,
    freezeTableName: true,
    schema: conf.schema,
    charset: 'latin1',
    //collate: 'utf8mb4_general_ci',                                  
  });
  return Resource;
};
