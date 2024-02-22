import {conf} from '../conf.js';
import {ServiceBase} from 'rf-service';
import {completeIncludeOptions, addEnabledOwnerModuleFilter, checkDataForMissingProperties, getSingle} from 'sql-util';
import {loc} from 'rf-util';

export class AssignableRolePerRoleService extends ServiceBase {
    sequelize = conf.global.sequelize;
    model = conf.global.models.AssignableRolePerRole;
    references = {
        role: conf.global.services.Role.singleton(),
        assignableRole: conf.global.services.Role.singleton(),
        ownerModule: conf.global.services.Module.singleton(),
    };
    defaultTranslationContext = 'assignableRolePerRole';

    constructor() {
        if (!conf?.global?.services?.Module?.singleton) {
            throw new Error('There is no Module service. Try adding RH Module module to the project.');
        }

        super();
    }

    async validateForCreation(data) {
        await checkDataForMissingProperties(data, 'AssignableRolePerRole', 'roleId', 'assignableRoleId');
        return super.validateForCreation(data);
    }

    /**
     * Creates a new row into DB if not exists.
     * @param {data} data - data for the new Role @see create.
     * @returns {Promise{Role}}
     */
    async createIfNotExists(data, options) {
        if (Array.isArray(data.assignableRole)) {
            const rows = [];
            for (const assignableRole of data.assignableRole) {
                rows.push(await this.createIfNotExists({...data, assignableRole}, options));
            }

            return rows;
        }

        if (Array.isArray(data.role)) {
            const rows = [];
            for (const role of data.role) {
                rows.push(await this.createIfNotExists({...data, role}, options));
            }

            return rows;
        }
        
        await this.completeReferences(data);

        const row = await this.getForAssignableRoleIdAndRoleId(
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
        if (row) {
            return row;
        }

        return this.create(data);
    }

    /**
     * Gets the options for use in the getList and getListAndCount methods.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {options}
     */
    async getListOptions(options) {
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
            options = addEnabledOwnerModuleFilter(options, conf.global.models.Module);
        }

        return options;
    }

    /**
     * Gets a assignable role for its assignable role ID and role ID. For many coincidences and for no rows this method fails.
     * @param {integer} assignableRoleId - assignable role ID for the row to get.
     * @param {integer} roleId - role ID for the row to get.
     * @returns {Promise[AssignableRolePerRole]}
     */
    async getForAssignableRoleIdAndRoleId(assignableRoleId, roleId, options) {
        const rowList = await this.getList({...options, where:{...options?.where, assignableRoleId, roleId}, limit: 2});
        return getSingle(rowList, {...options, params: [loc._f('assignable roles'), ['assignableRoleId = %s, and roleId = %s', assignableRoleId, roleId], loc._f('Assignable roles per role')]});
    }

    async getAssignableRolesIdForRoleId(roleId, options) {
        return this.getList({attributes: ['assignableRoleId'], ...options, where:{...options?.where, roleId}});
    }

    async getAssignableRolesIdForRoleName(roleName, options) {
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
        
        const assignableRolePerRole = await this.getList({attributes: ['assignableRoleId'], ...options});

        return assignableRolePerRole.map(row => row.assignableRoleId);
    } 
}