import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class Asset extends sequelize.Sequelize.Model {
    static associate(models) {
      if (!models.Project) {
        throw new Error('There is no Project model. Try adding RH Project module to the project.');
      }
        
      this.belongsTo(models.Project,   { as: 'project', foreignKey: 'projectId' });
      this.belongsTo(models.AssetType, { as: 'type',    foreignKey: 'typeId' });
    }
  }

  Asset.init({
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
    translationContext: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    typeId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    projectId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    sequelize,
    timestamps: true,
    tableName: 'Asset',
    schema: conf.schema,
  });
  return Asset;
};
