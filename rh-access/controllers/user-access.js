import { getOptionsFromParamsAndOData, HttpError } from 'http-util';
import { checkParameterUuid, checkParameterUuidList, checkNotNullNotEmptyAndNotUndefined } from 'rf-util';
import { defaultLoc } from 'rf-locale';
import dependency from 'rf-dependency';
import { Controller } from 'rh-controller';
import { isAdmin } from '../is-admin.js';

export class UserAccessController extends Controller {
  constructor() {
    super();

    this.userAccessService = dependency.get('userAccessService');
    this.userService = dependency.get('userService');
    this.roleService = dependency.get('roleService');
    this.siteService = dependency.get('siteService');
    this.userSiteRoleService = dependency.get('userSiteRoleService');
    this.assignableRolePerRoleService = dependency.get('assignableRolePerRoleService');
    this.permissionService = dependency.get('permissionService');
  }

  async getInterface(req) {
    const gridActions = [];
    if (req.permissions.includes('user-access.create')) gridActions.push('create');
    if (req.permissions.includes('user-access.edit'))   gridActions.push('edit');
    if (req.permissions.includes('user-access.delete')) gridActions.push('delete');
    gridActions.push('search', 'paginate');
        
    const loc = req.loc ?? defaultLoc;

    const fields = [
      {
        name:            'user.uuid',
        gridName:        'user.displayName',
        type:            'select',
        label:           await loc._('User'),
        isField:         true,
        isColumn:        true,
        loadOptionsFrom: {
          service: 'user-access/user',
          value:   'uuid',
          text:    'displayName',
          title:   'username',
        },
        disabled:        {
          create:       false,
          defaultValue: true,
        },
      },
      {
        name:            'site.uuid',
        gridName:        'site.title',
        type:            'select',
        label:           await loc._('Site'),
        isField:         true,
        isColumn:        true,
        loadOptionsFrom: {
          service: 'user-access/site',
          value:   'uuid',
          text:    'title',
          title:   'description',
        },
        disabled:        {
          create:       false,
          defaultValue: true,
        },
      },
      {
        name:            'roles',
        type:            'select',
        gridType:        'list',
        label:           await loc._('Roles'),
        singleProperty:  'title',
        multiple:        true,
        big:             true,
        isColumn:        true,
        isField:         true,
        loadOptionsFrom: {
          service: 'user-access/role',
          value:   'uuid',
          text:    'title',
          title:   'description',
        },
      },
    ];

    const result = {
      title: await loc._('User access'),
      gridTitle: await loc._('Users accesses'),
      load: {
        service: 'user-access',
        method: 'get',
      },
      action: 'user-access',
      method: 'POST',
      gridActions,
      fields,
    };

    return result;
  }

  postPermission = 'user-access.create';
  async post(req) {
    let userUuid = req.body.user?.uuid ?? req.body['user.uuid'] ?? (typeof req.body.user === 'string' ? req.body.user : undefined);
    let siteUuid = req.body.site?.uuid ?? req.body['site.uuid'] ?? (typeof req.body.site === 'string' ? req.body.site : undefined);
    const rawRoles = req.body.roles ?? req.body['roles'];

    const roleUuids = checkParameterUuidList(
      rawRoles,
      loc => loc._c('userAccess', 'Roles'),
    );

    if (req.body.uuid) {
      if (!userUuid) {
        userUuid = req.body.uuid.split(',')[0];
      }

      if (!siteUuid) {
        siteUuid = req.body.uuid.split(',')[1];
      }
    }

    checkParameterUuid(userUuid, loc => loc._c('userAccess', 'User'));

    const userId = await this.userService.getSingleIdForUuid(userUuid);
    
    let siteId;
    if (siteUuid) {
      checkParameterUuid(siteUuid, loc => loc._c('userAccess', 'Site'));
      siteId = await this.siteService.getSingleIdForUuid(siteUuid);
    } else {
      if (!req.site?.id) {
        throw new HttpError(loc => loc._c('userAccess', 'Site UUID param is missing.'), 400);
      }
      siteId = req.site.id;
    }

    const rolesId = [];
    for (const roleUuid of roleUuids) {
      const roleId = await this.roleService.getSingleIdForUuid(roleUuid);
      if (roleId) {
        rolesId.push(roleId);
      }
    }

    if (!rolesId.length) {
      throw new HttpError(loc => loc._c('userAccess', 'No valid roles provided.'), 400);
    }

    let assignableRolesId;
    if (!isAdmin({ roles: req.roles, username: req.user?.username })) {
      assignableRolesId = await this.assignableRolePerRoleService.getAssignableRolesIdForRoleName(req.roles);
    }

    const assignedRolesId = [];
    for (const roleId of rolesId) {
      if (!assignableRolesId || assignableRolesId.includes(roleId)) {
        assignedRolesId.push(roleId);
        const existing = await this.userSiteRoleService.getList({
          attributes: ['userId'],
          where: { userId, siteId, roleId },
        });
        if (!existing?.length) {
          await this.userSiteRoleService.create({ userId, siteId, roleId });
        }
      }
    }

    const deleteData = { userId, siteId };
    if (assignableRolesId) {
      deleteData.roleId = assignableRolesId;
    }
    deleteData.notRoleId = rolesId;
    await this.userSiteRoleService.deleteFor(deleteData);
  }

  getPermission = 'user-access.get';
  async getData(req) {
    const loc = req.loc ?? defaultLoc;
    let options = {
      limit: 10,
      offset: 0,
      view: true,
      where: {},
      loc,
      include: {
        user:  {},
        site:  {},
        role: { attributes: ['name', 'title', 'uuid'] },
      },
    };

    const definitions = { uuid: 'string', username: 'string' };
    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);

    if (req.site?.id) {
      options.where ??= {};
      options.where.siteId = req.site.id;
    }

    if (!isAdmin({ roles: req.roles, username: req.user?.username })) {
      const assignableRolesId = await this.assignableRolePerRoleService.getAssignableRolesIdForRoleName(req.roles);
      options.include.role = {
        ...options.include.role,
        where: {
          ...options.include.role.where,
          id: assignableRolesId,
        },
      };
    }

    if (req.query?.userUuids) {
      const userUuids = checkParameterUuidList(req.query.userUuids, loc => loc._c('userAccess', 'Users'));
      options.include.user = { ...options.include.user, where: { ...options.include.user.where, uuid: userUuids }};
    }

    if (options.where?.uuid) {
      const uuid = options.where.uuid.split(',');
      delete options.where.uuid;

      options.include.user = { ...options.include.user, where: { ...options.include.user.where, uuid: uuid[0] }};
      options.include.site = { ...options.include.site, where: { ...options.include.site.where, uuid: uuid[1] }};
    }

    const result = await this.userAccessService.getListAndCount(options);

    return result;
  }

  'getPermission /user-site' = 'user-access.edit';
  async 'get /user-site'(req) {
    const userUuid = checkParameterUuid(req.query?.userUuid, loc => loc._c('userAccess', 'User'));

    const options = {
      view: true,
      loc: req.loc ?? defaultLoc,
      include: {
        user: { where: { uuid: userUuid }},
        site: {},
        role: { attributes: ['name', 'title', 'uuid'] },
      },
    };

    if (!isAdmin({ roles: req.roles, username: req.user?.username })) {
      options.include.role.where = {
        id: await this.assignableRolePerRoleService.getAssignableRolesIdForRoleName(req.roles),
      };
    }

    return this.userAccessService.getListAndCount(options);
  }

  'getPermission /user' = 'user-access.edit';
  async 'get /user'(req) {
    const definitions = { uuid: 'uuid', title: 'string' };
    let options = {
      view:       true,
      limit:      100,
      offset:     0,
      attributes: ['uuid', 'username', 'displayName'],
      isEnabled:  true,
    };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    const result = await this.userService.getListAndCount(options);

    return result;
  }

  'getPermission /site' = 'user-access.edit';
  async 'get /site'(req) {
    const definitions = { uuid: 'uuid', title: 'string' };
    let options = {
      view:       true,
      limit:      100,
      offset:     0,
      attributes: ['uuid', 'name', 'title', 'description'],
      isEnabled:  true,
    };
      
    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    const result = await this.siteService.getListAndCount(options);

    return result;
  }

  'getPermission /role' = 'user-access.edit';
  async 'get /role'(req) {
    const definitions = { uuid: 'uuid', title: 'string' };
    let options = {
      view:       true,
      limit:      100,
      offset:     0,
      attributes: ['uuid', 'name', 'title', 'description'],
      isEnabled:  true,
    };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);

    if (!isAdmin({ roles: req.roles, username: req.user?.username })) {
      options.where = { ...options?.where, id: await this.assignableRolePerRoleService.getAssignableRolesIdForRoleName(req.roles) };
    }

    const result = await this.roleService.getListAndCount(options);
        
    const loc = req.loc ?? defaultLoc;
    const includePermissions = req.query?.includePermissions === 'true';
    result.rows = await Promise.all(result.rows.map(async row => {
      if (row.isTranslatable)
        row.title = await loc._(row.title);

      delete row.isTranslatable;

      if (includePermissions) {
        const permissions = await this.permissionService.getForRolesName(
          [row.name],
          {
            attributes: ['uuid', 'name', 'title', 'description', 'isTranslatable'],
            isEnabled: true,
            skipThroughAssociationAttributes: true,
          },
        );
        row.permissions = await Promise.all(permissions.map(async permission => {
          const { isTranslatable, ...rest } = permission;
          if (isTranslatable)
            rest.title = await loc._(rest.title);

          return rest;
        }));
      }

      return row;
    }));

    return result;
  }

  deleteForUuidPermission = 'user-access.delete';
  async defaultDeleteForUuid(req, res, next) {
    await this.checkPermissionsFromProperty(req, res, next, 'deleteForUuidPermission');
    await this.deleteForUuid(req, res);
  }

  async deleteForUuid(req, res) {
    const loc = req.loc ?? defaultLoc;

    let userUuid = checkParameterUuid(
      req.body.User,
      {
        paramTitle:     loc._c('userAccess', 'User'),
        allowNull:      true,
        allowUndefined: true,
      },
    );
    let siteUuid = checkParameterUuid(
      req.body.Site,
      {
        paramTitle:     loc => loc._c('userAccess', 'Site'),
        allowNull:      true,
        allowUndefined: true,
      },
    );
    if (userUuid) {
      if (!siteUuid) {
        throw new HttpError(loc => loc._c('userAccess', 'Site UUID param is missing.'), 403);
      }
    } else if (siteUuid) {
      throw new HttpError(loc => loc._c('userAccess', 'User UUID param is missing.'), 403);
    } else {
      const uuid = await checkNotNullNotEmptyAndNotUndefined(
        req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid,
        loc => loc._c('userAccess', 'UUID'),
      );
      const uuidParts = uuid.split(',');
      if (uuidParts.length !== 2) {
        throw new HttpError(loc => loc._c('userAccess', 'Wrong UUID format.'), 403);
      }

      userUuid = checkParameterUuid(uuidParts[0], loc => loc._c('userAccess', 'User'));
      siteUuid = checkParameterUuid(uuidParts[1], loc => loc._c('userAccess', 'Site'));
    }

    const deleteWhere = {
      userId: await this.userService.getSingleIdForUuid(userUuid),
      siteId: await this.siteService.getSingleIdForUuid(siteUuid),
    };
    if (!isAdmin({ roles: req.roles, username: req.user?.username })) {
      deleteWhere.roleId = await this.assignableRolePerRoleService.getAssignableRolesIdForRoleName(req.roles);
    }

    const rowsDeleted = await this.userAccessService.deleteFor(deleteWhere);

    if (!rowsDeleted) {
      throw new HttpError(loc => loc._c('userAccess', 'User with UUID %s has not access to the site with UUID %s.'), 403, userUuid, siteUuid);
    }

    res.sendStatus(204);
  }
}