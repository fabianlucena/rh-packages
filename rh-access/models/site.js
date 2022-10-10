'use strict';

const conf = require('../index');
const sqlUtil = require('sql-util');

module.exports = (sequelize, DataTypes) => {
    class Site extends sequelize.Sequelize.Model {
        static associate(models) {
            this.belongsToMany(models.Module,  {through: models.SiteModule,   foreignKey: 'siteId', otherKey: 'moduleId'});
            this.belongsToMany(models.Session, {through: models.SessionSite,  foreignKey: 'siteId', otherKey: 'sessionId'});
        }
        static postAssociate(models) {
            this.belongsToMany(models.User,        {through: models.UserRoleSite, foreignKey: 'siteId', otherKey: 'userId'});
            this.belongsToMany(models.Role,        {through: models.UserRoleSite, foreignKey: 'siteId', otherKey: 'roleId'});

            models.User.belongsToMany(models.Site, {through: models.UserRoleSite, foreignKey: 'userId', otherKey: 'siteId'});
        }
        static async check() {
            return sqlUtil.addIfNotExistsByName(
                Site,
                {
                    name:  'system',
                    title: 'System'
                });
        }
    }
    Site.init({
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
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    }, {
        sequelize,
        timestamps: true,
        freezeTableName: true,
        schema: conf.schema,
    });
    return Site;
};
