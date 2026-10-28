import { UserService } from '../services/user.js';
import { getOptionsFromParamsAndOData, HttpError } from 'http-util';
import { defaultLoc } from 'rf-locale';
import { checkParameter, checkParameterUuid } from 'rf-util';
import dependency from 'rf-dependency';

export class UserController {
  static init() {
    UserController.roleService = dependency.get('roleService', null);
    UserController.userSiteRoleService = dependency.get('userSiteRoleService', null);
  }

  static async post(req, res) {
    await UserService.singleton().create(req.body);
    res.status(204).send();
  }

  static async get(req, res) {
    if ('$grid' in req.query) {
      return UserController.getGrid(req, res);
    } else if ('$form' in req.query) {
      return UserController.getForm(req, res);
    }
            
    const definitions = { uuid: 'uuid', username: 'string' };
    let options = {
      view: true,
      limit: 10,
      offset: 0,
      include: { type: true },
    };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);

    if (req.query.roleUuid) {
      options.where = { ...options.where, id: await UserController.getUserIdsForRoleUuid(req.query.roleUuid, req.site?.id) };
    }

    const result = await UserService.singleton().getListAndCount(options);

    res.status(200).send(result);
  }

  static async getUserIdsForRoleUuid(roleUuid, siteId) {
    if (!UserController.roleService || !UserController.userSiteRoleService) {
      throw new HttpError(loc => loc._c('user', 'Filtering by role is not available.'), 400);
    }

    checkParameterUuid(roleUuid, loc => loc._c('user', 'Role'));
    const roleId = await UserController.roleService.getIdOrNullForUuid(roleUuid);
    if (!roleId) {
      return [];
    }

    const where = { roleId };
    if (siteId) {
      where.siteId = siteId;
    }

    const userSiteRoles = await UserController.userSiteRoleService.getList({ attributes: ['userId'], where });
    return [...new Set(userSiteRoles.map(userSiteRole => userSiteRole.userId))];
  }

  static async getGrid(req, res) {
    checkParameter(req.query, '$grid');

    const actions = [];
    if (req.permissions.includes('user.create')) actions.push('create');
    if (req.permissions.includes('user.edit'))   actions.push('enableDisable', 'edit');
    if (req.permissions.includes('user.delete')) actions.push('delete');
    actions.push('search', 'paginate');
                
    const loc = req.loc ?? defaultLoc;

    res.status(200).send({
      title: await loc._c('user', 'User'),
      load: {
        service: 'user',
        method: 'get',
      },
      actions,
      columns: [
        {
          name: 'displayName',
          type: 'text',
          label: await loc._c('user', 'Display name'),
        },
        {
          name: 'username',
          type: 'text',
          label: await loc._c('user', 'Username'),
        },
      ]
    });
  }

  static async getForm(req, res) {
    checkParameter(req.query, '$form');

    const loc = req.loc ?? defaultLoc;
    res.status(200).send({
      title: await loc._c('user', 'Users'),
      action: 'user',
      fields: [
        {
          name: 'displayName',
          type: 'text',
          label: await loc._c('user', 'Display name'),
          placeholder: await loc._c('user', 'Type the display name here'),
          autocomplete: 'off',
        },
        {
          name: 'username',
          type: 'text',
          label: await loc._c('user', 'Username'),
          placeholder: await loc._c('user', 'Username'),
          autocomplete: 'off',
          disabled: {
            create: false,
            defaultValue: true,
          },
        },
        {
          name: 'isEnabled',
          type: 'checkbox',
          label: await loc._c('user', 'Enabled'),
          placeholder: await loc._c('user', 'Enabled'),
          value: true,
        },
        {
          name: 'password',
          type: 'password',
          label: await loc._c('user', 'Password'),
          placeholder: await loc._c('user', 'Type here the new password for user'),
          autocomplete: 'off',
        },
      ],
    });
  }

  static async delete(req, res) {
    const allParams = { ...req?.body, ...req?.query, ...req?.params };
    checkParameter(allParams, 'uuid');
    const uuid = checkParameterUuid(allParams.uuid, loc => loc._c('user', 'UUID'));
    const rowsDeleted = await UserService.singleton().deleteForUuid(uuid);
    if (!rowsDeleted) {
      throw new HttpError(loc => loc._c('user', 'User with UUID %s does not exist.'), 404, uuid);
    }

    res.sendStatus(204);
  }

  static async enablePost(req, res) {
    const uuid = await checkParameterUuid(
      req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid,
      loc => loc._c('user', 'UUID'),
    );
    const rowsUpdated = await UserService.singleton().enableForUuid(uuid);
    if (!rowsUpdated) {
      throw new HttpError(loc => loc._c('user', 'User with UUID %s does not exist.'), 403, uuid);
    }

    res.sendStatus(204);
  }

  static async disablePost(req, res) {
    const uuid = await checkParameterUuid(
      req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid,
      loc => loc._c('user', 'UUID'),
    );
    const rowsUpdated = await UserService.singleton().disableForUuid(uuid);
    if (!rowsUpdated) {
      throw new HttpError(loc => loc._c('user', 'User with UUID %s does not exist.'), 403, uuid);
    }

    res.sendStatus(204);
  }

  static async patch(req, res) {
    const uuid = await checkParameterUuid(
      req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid,
      loc => loc._c('user', 'UUID'),
    );
    const rowsUpdated = await UserService.singleton().updateForUuid(req.body, uuid);
    if (!rowsUpdated) {
      throw new HttpError(loc => loc._c('user', 'User with UUID %s does not exist.'), 403, uuid);
    }

    res.sendStatus(204);
  }
}