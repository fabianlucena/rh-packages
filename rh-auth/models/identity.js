'use strict';

import {conf} from '../conf.js';
import {execAsyncMethodListAsync} from 'http-util';
import {getSingleRowProperty, addIfNotExists} from 'sql-util';

export default (sequelize, DataTypes) => {
    class Identity extends sequelize.Sequelize.Model {
        static associate(models) {
            this.belongsTo(models.User,         {foreignKey: 'userId', allowNull: false, onDelete: 'cascade'});
            this.belongsTo(models.IdentityType, {foreignKey: 'typeId', allowNull: false});
        }

        static check(asyncMethodList) {
            let userId;
            return execAsyncMethodListAsync(asyncMethodList, 'User')
                .then(() => execAsyncMethodListAsync(asyncMethodList, 'IdentityType'))
                .then(() => getSingleRowProperty(sequelize.models.User, {username: 'admin'}, 'id'))
                .then(uId => userId = uId)
                .then(() => getSingleRowProperty(sequelize.models.IdentityType, {name: 'local'}, 'id'))
                .then(identityTypeId => {
                    return addIfNotExists(
                        Identity,
                        ['userId', 'typeId'],
                        {
                            userId:    userId,
                            typeId:    identityTypeId,
                            isEnabled: 1,
                            data:      '{"password":"da842b69d8f584f01700f64af185fd59:cd3569832703bf38d0ad86ed9f2ae95e1f385ba998e630a5032523d19405901886aad13b5f9edd6b6acfae7861109baab9c52020338c753d24e8f0a11fea4c45"}' // password: 1234
                        });
                }
                );
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
