import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class WfTransition extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.Module,   { as: 'ownerModule', foreignKey: 'ownerModuleId' });
      this.belongsTo(models.WfType,   { as: 'type',        foreignKey: 'typeId'        });
      this.belongsTo(models.WfStatus, { as: 'from',        foreignKey: 'fromId'        });
      this.belongsTo(models.WfStatus, { as: 'to',          foreignKey: 'toId'          });
    }
  }
  WfTransition.init({
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
    typeId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    fromId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    toId: {
      type: DataTypes.BIGINT,
      allowNull: false,
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
    ownerModuleId: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
  }, {
    sequelize,
    timestamps: true,
    tableName: 'Transition',
    schema: conf.schema,
  });
  return WfTransition;
};
