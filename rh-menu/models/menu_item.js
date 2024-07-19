import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class MenuItem extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.Module,     { as: 'ownerModule', foreignKey: 'ownerModuleId' });
      this.belongsTo(models.MenuItem,   { as: 'parent',      foreignKey: 'parentId', allowNull: true, onUpdate: 'NO ACTION', onDelete: 'NO ACTION' });
      this.belongsTo(models.Permission, { as: 'permission',  foreignKey: 'permissionId' });
    }
  }
  MenuItem.init({
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
    isTranslatable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    translationContext: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    jsonData: {
      type: DataTypes.STRING,
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
    schema: conf.schema
  });
  return MenuItem;
};
