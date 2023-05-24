import {conf} from '../conf.js';
import {completeIncludeOptions, addEnabledOnerModuleFilter, checkDataForMissingProperties, getSingle} from 'sql-util';
import {loc} from 'rf-locale';

export class AssignableRolePerRoleService {
    /**
     * Complete the data object with the roleId property if not exists. 
     * @param {{role: string, roleId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completeRoleId(data) {
        if (!data.roleId && data.role)
            data.roleId = await conf.global.services.Role.getIdForName(data.role);

        return data;
    }

    /**
     * Complete the data object with the assignableRoleId property if not exists. 
     * @param {{assignableRole: string, assignableRoleId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completeAssignableRoleId(data) {
        if (!data.assignableRoleId && data.assignableRole)
            data.assignableRoleId = await conf.global.services.Role.getIdForName(data.assignableRole);

        return data;
    }
    
    /**
     * Complete the data object with the ownerModuleId property if not exists. 
     * @param {{module: string, moduleId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completeOwnerModuleId(data) {
        if (!data.ownerModuleId && data.ownerModule)
            data.ownerModuleId = await conf.global.services.Module.getIdForName(data.ownerModule);

        return data;
    }

    /**
     * Creates a new row into DB.
     * @param {{
     *  role || roleId: string || int,
     *  assignableRole || assignableRoleId: string || int,
     * }} data - data for the new Role.
     * @returns {Promise{Role}}
     */
    static async create(data) {
        await AssignableRolePerRoleService.completeRoleId(data);
        await AssignableRolePerRoleService.completeAssignableRoleId(data);
        await AssignableRolePerRoleService.completeOwnerModuleId(data);

        await checkDataForMissingProperties(data, 'AssignableRolePerRole', 'roleId', 'assignableRoleId');

        return conf.global.models.AssignableRolePerRole.create(data);
    }

    /**
     * Creates a new row into DB if not exists.
     * @param {data} data - data for the new Role @see create.
     * @returns {Promise{Role}}
     */
    static async createIfNotExists(data, options) {
        if (Array.isArray(data.assignableRole)) {
            for (const assignableRole of data.assignableRole)
                await AssignableRolePerRoleService.createIfNotExists({...data, assignableRole}, options);

            return;
        }

        if (Array.isArray(data.role)) {
            for (const role of data.role)
                await AssignableRolePerRoleService.createIfNotExists({...data, role}, options);

            return;
        }

        await AssignableRolePerRoleService.completeRoleId(data);
        await AssignableRolePerRoleService.completeAssignableRoleId(data);

        const row = await AssignableRolePerRoleService.getForAssignableRoleIdAndRoleId(
            data.assignableRoleId,
            data.roleId,
            {
                attributes: ['assignableRoleId', 'roleId'],
                foreign:{
                    module:{attributes:[]},
                    assignableRole:{attributes:[]},
                    role:{attributes:[]},
                },
                skipNoRowsError: true,
                ...options
            }
        );
        if (row)
            return row;

        return AssignableRolePerRoleService.create(data);
    }

    /**
     * Gets the options for use in the getList and getListAndCount methods.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {options}
     */
    static async getListOptions(options) {
        if (options.q) {
            const q = `%${options.q}%`;
            const Op = conf.global.Sequelize.Op;
            
            options = completeIncludeOptions(
                options,
                'assignableRoleId',
                {
                    model: conf.global.models.Role,
                    as: 'assignableRole',
                    where: {
                        [Op.or]: [
                            {name:  {[Op.like]: q}},
                            {title: {[Op.like]: q}},
                        ],
                    },
                    required: false,
                    skipAssociationAttributes: true,
                }
            );

            options = completeIncludeOptions(
                options,
                'roleId',
                {
                    model: conf.global.models.Role,
                    as: 'assignableRole',
                    where: {
                        [Op.or]: [
                            {name:  {[Op.like]: q}},
                            {title: {[Op.like]: q}},
                        ],
                    },
                    required: false,
                    skipAssociationAttributes: true,
                }
            );
        }

        if (options.isEnabled !== undefined) {
            options = addEnabledOnerModuleFilter(options, conf.global.models.Module);
        }

        return options;
    }

    /**
     * Gets a list of assignable roles per role.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{RoleList}}
     */
    static async getList(options) {
        return conf.global.models.AssignableRolePerRole.findAll(await AssignableRolePerRoleService.getListOptions(options));
    }
    
    /**
     * Gets a list of assignable roles per role and the rows count.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{RoleList, count}}
     */
    static async getListAndCount(options) {
        return conf.global.models.AssignableRolePerRole.findAndCountAll(await AssignableRolePerRoleService.getListOptions(options));
    }

    /**
     * Gets a assignable role for its assignable role ID and role ID. For many coincidences and for no rows this method fails.
     * @param {integer} assignableRoleId - assignable role ID for the row to get.
     * @param {integer} roleId - role ID for the row to get.
     * @returns {Promise[AssignableRolePerRole]}
     */
    static async getForAssignableRoleIdAndRoleId(assignableRoleId, roleId, options) {
        const rowList = await AssignableRolePerRoleService.getList({...options, where:{...options.where, assignableRoleId, roleId}, limit: 2});
        return getSingle(rowList, {...options, params: [loc._f('assignable roles'), ['assignableRoleId = %s, and roleId = %s', assignableRoleId, roleId], loc._f('Assignable roles per role')]});
    }

    static async getAssignableRolesIdForRoleId(roleId, options) {
        return AssignableRolePerRoleService.getList({attributes: ['assignableRoleId'], ...options, where:{...options.where, roleId}});
    }

    static async getAssignableRolesIdForRoleName(roleName, options) {
        options = completeIncludeOptions(
            options,
            'roleId',
            {
                model: conf.global.models.Role,
                as: 'Role',
                where: {name: roleName},
                required: false,
                skipAssociationAttributes: true,
            }
        );
        
        const assignableRolePerRole = await AssignableRolePerRoleService.getList({ attributes: ['assignableRoleId'], ...options});

        return assignableRolePerRole.map(row => row.assignableRoleId);
    } 
}