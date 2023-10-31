import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class UserSiteRole extends sequelize.Sequelize.Model {
        static associate(models) {
            this.belongsTo(models.User,   {foreignKey: 'userId'});
            this.belongsTo(models.Site,   {foreignKey: 'siteId'});
            this.belongsTo(models.Role,   {foreignKey: 'roleId'});
            this.belongsTo(models.Module, {foreignKey: 'ownerModuleId', as: 'OwnerModule', allowNull: true});
        }

        static postAssociate(models) {
            models.Site.belongsToMany(models.User, {through: models.UserSiteRole, foreignKey: 'siteId', otherKey: 'userId', unique: 'unop'});
            models.User.belongsToMany(models.Site, {through: models.UserSiteRole, foreignKey: 'userId', otherKey: 'siteId', unique: 'unop'});
            models.Site.belongsToMany(models.Role, {through: models.UserSiteRole, foreignKey: 'siteId', otherKey: 'roleId', unique: 'unop'});
        }
    }
    UserSiteRole.init({
        userId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
        },
        siteId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
        },
        roleId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
        },
        isEnabled: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
    }, {
        sequelize,
        timestamps: true,
        freezeTableName: true,
        schema: conf.schema,
        /*indexes: [
            {
                unique: true,
                fields: ['userId', 'siteId', 'roleId']
            }
        ],*/
    });
    return UserSiteRole;
};
