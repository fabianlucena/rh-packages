'use strict';

const conf = require('../index');
const sqlUtil = require('sql-util');

module.exports = (sequelize, DataTypes) => {
  class PermissionType extends sequelize.Sequelize.Model {
    static associate(models) {
    }
    static check() {
      return sqlUtil.addIfNotExistsByName(
        PermissionType,
        {
          name:  'public',
          title: 'Public'
        }, {
          name:  'private',
          title: 'Private'
        });
    }
  }
  PermissionType.init({
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
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    }
  }, {
    sequelize,
    timestamps: true,
    freezeTableName: true,
    schema: conf.schema,
  });
  return PermissionType;
};
