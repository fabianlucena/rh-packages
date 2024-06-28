import { conf } from '../conf.js';
import { getOptionsFromParamsAndOData, _HttpError } from 'http-util';
import { checkParameter, checkParameterUuid, checkParameterUuidList, checkNotNullNotEmptyAndNotUndefined } from 'rf-util';
import { defaultLoc } from 'rf-locale';
import dependency from 'rf-dependency';

export class UserAccessController {
  static async post(req, res) {
    const loc = req.loc ?? defaultLoc;
    const data = {
      userUuid: checkParameterUuid(req.body.User, loc._cf('userAccess', 'User')),
      siteUuid: checkParameterUuid(req.body.Site, loc._cf('userAccess', 'Site')),
      rolesUuid: await checkParameterUuidList(req.body.Roles, loc._cf('userAccess', 'Roles')),
    };

    if (req.body.Site) {
      const siteUuid = checkParameterUuid(req.body.Site, loc._cf('userAccess', 'Site'));
      if (siteUuid) {
        data.siteUuid = siteUuid;
      } else if (!req.site?.id) {
        throw new _HttpError(loc._cf('userAccess', 'Site UUID param is missing.'), 400);
      } else {
        data.siteId = req.site.id;
      }
    }

    if (!req.roles.includes('admin')) {
      data.assignableRolesId = await dependency.get('assignableRolePerRoleService').getAssignableRolesIdForRoleName(req.roles);
    }

    await dependency.get('userAccessService').create(data);

    res.status(204).send();
  }

  static async get(req, res) {
    if ('$grid' in req.query)
      return this.getGrid(req, res);
    else if ('$form' in req.query)
      return this.getForm(req, res);
            
    const loc = req.loc ?? defaultLoc;
    let options = {
      limit: 10,
      offset: 0,
      view: true,
      where: {},
      loc,
      includeUser: true,
      includeSite: true,
      includeRoles: true,
    };

    const definitions = { uuid: 'string', username: 'string' };
    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);

    if (req.site?.id) {
      options.where ??= {};
      options.where.siteId = req.site.id;
    }

    if (!req.roles.includes('admin')) {
      const assignableRolesId = await dependency.get('assignableRolePerRoleService').getAssignableRolesIdForRoleName(req.roles);
      options.includeRolesId = assignableRolesId;
    }

    if (options.where?.uuid) {
      const uuid = options.where.uuid.split(',');
      delete options.where.uuid;

      options.includeUser = { ...options.includeUser, where: { ...options.includeUser.where, uuid: uuid[0] }};
      options.includeSite = { ...options.includeSite, where: { ...options.includeSite.where, uuid: uuid[1] }};
    }

    const result = await dependency.get('userAccessService').getListAndCount(options);

    res.status(200).send(result);
  }

  static async getGrid(req, res) {
    checkParameter(req.query, '$grid');

    const actions = [];
    if (req.permissions.includes('user-access.create')) actions.push('create');
    if (req.permissions.includes('user-access.edit'))   actions.push('edit');
    if (req.permissions.includes('user-access.delete')) actions.push('delete');
    actions.push('search', 'paginate');
        
    const loc = req.loc ?? defaultLoc;

    res.status(200).send({
      title: await loc._('Users accesses'),
      load: {
        service: 'user-access',
        method: 'get',
      },
      actions: actions,
      columns: [
        {
          name: 'User.displayName',
          type: 'text',
          label: await loc._('User'),
        },
        {
          name: 'Site.title',
          type: 'text',
          label: await loc._('Site'),
        },
        {
          name: 'Roles',
          type: 'list',
          label: await loc._('Roles'),
          singleProperty: 'title',
        },
      ]
    });
  }

  static async getForm(req, res) {
    checkParameter(req.query, '$form');

    const loc = req.loc ?? defaultLoc;
    res.status(200).send({
      title: await loc._('User access'),
      action: 'user-access',
      method: 'POST',
      fields: [
        {
          name: 'User',
          type: 'select',
          label: await loc._('User'),
          loadOptionsFrom: {
            service: 'user-access-user',
            value: 'uuid',
            text: 'displayName',
            title: 'username',
          },
          disabled: {
            create: false,
            defaultValue: true,
          },
        },
        {
          name: 'Site',
          type: 'select',
          label: await loc._('Sites'),
          loadOptionsFrom: {
            service: 'user-access-site',
            value: 'uuid',
            text: 'title',
            title: 'description',
          },
          disabled: {
            create: false,
            defaultValue: true,
          },
        },
        {
          name: 'Roles',
          type: 'select',
          multiple: true,
          big: true,
          label: await loc._('Roles'),
          loadOptionsFrom: {
            service: 'user-access-role',
            value: 'uuid',
            text: 'title',
            title: 'description',
          },
        },
      ],
    });
  }

  static async getUsers(req, res) {
    const definitions = { uuid: 'uuid', title: 'string' };
    let options = { view: true, limit: 100, offset: 0, attributes: ['uuid', 'username', 'displayName'], isEnabled: true };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);

    const userService = conf.global.services.User.singleton();
    const result = await userService.getListAndCount(options);

    res.status(200).send(result);
  }

  static async getSites(req, res) {
    const definitions = { uuid: 'uuid', title: 'string' };
    let options = { view: true, limit: 100, offset: 0, attributes: ['uuid', 'name', 'title', 'description'], isEnabled: true };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);

    const siteService = conf.global.services.Site.singleton();
    const result = await siteService.getListAndCount(options);

    res.status(200).send(result);
  }

  static async getRoles(req, res) {
    const definitions = { uuid: 'uuid', title: 'string' };
    let options = {
      view: true,
      limit: 100,
      offset: 0,
      attributes: ['uuid', 'name', 'title', 'description', 'isTranslatable'],
      isEnabled: true,
      raw: true,
    };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);

    if (!req.roles.includes('admin'))
      options.where = { ...options?.where, id: await dependency.get('assignableRolePerRoleService').getAssignableRolesIdForRoleName(req.roles) };

    const result = await dependency.get('roleService').getListAndCount(options);
        
    const loc = req.loc ?? defaultLoc;
    result.rows = await Promise.all(result.rows.map(async row => {
      if (row.isTranslatable)
        row.title = await loc._(row.title);

      delete row.isTranslatable;

      return row;
    }));

    res.status(200).send(result);
  }

  static async delete(req, res) {
    const loc = req.loc ?? defaultLoc;

    let userUuid = checkParameterUuid(req.body.User, { paramTitle: loc._cf('userAccess', 'User'), allowNull: true, allowUndefined: true });
    let siteUuid = checkParameterUuid(req.body.Site, { paramTitle: loc._cf('userAccess', 'Site'), allowNull: true, allowUndefined: true });
    if (userUuid) {
      if (!siteUuid)
        throw new _HttpError(loc._cf('userAccess', 'Site UUID param is missing.'), 403);
    } else if (siteUuid)
      throw new _HttpError(loc._cf('userAccess', 'User UUID param is missing.'), 403);
    else {
      const uuid = await checkNotNullNotEmptyAndNotUndefined(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, loc._cf('userAccess', 'UUID'));
      const uuidParts = uuid.split(',');
      if (uuidParts.length !== 2)
        throw new _HttpError(loc._cf('userAccess', 'Wrong UUID format.'), 403);

      userUuid = checkParameterUuid(uuidParts[0], loc._cf('userAccess', 'User'));
      siteUuid = checkParameterUuid(uuidParts[1], loc._cf('userAccess', 'Site'));
    }

    let rowsDeleted;
    const deleteWhere = { userUuid, siteUuid };
    if (!req.roles.includes('admin'))
      deleteWhere.notRoleName = await dependency.get('assignableRolePerRoleService').getAssignableRolesIdForRoleName(req.roles);

    rowsDeleted = await dependency.get('userAccessService').deleteFor(deleteWhere);

    if (!rowsDeleted)
      throw new _HttpError(loc._cf('userAccess', 'User with UUID %s has not access to the site with UUID %s.'), 403, userUuid, siteUuid);

    res.sendStatus(204);
  }
}