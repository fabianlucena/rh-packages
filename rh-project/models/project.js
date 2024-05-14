import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class Project extends sequelize.Sequelize.Model {
    static associate(models) {
      if (models.Company) {
        this.belongsTo(models.Company, { as: 'company', foreignKey: 'companyId' });
      }
    }

    static postAssociate(models) {
      this.hasMany(models.Share, { as: 'share', foreignKey: 'objectId' });
      this.hasOne (models.Share, { as: 'owner', foreignKey: 'objectId' });
    }
  }
  Project.init({
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
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isTranslatable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    sequelize,
    timestamps: true,
    freezeTableName: true,
    schema: conf.schema,
  });
  return Project;
};
