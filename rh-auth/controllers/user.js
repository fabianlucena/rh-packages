import { UserService } from '../services/user.js';
import { getOptionsFromParamsAndOData, _HttpError } from 'http-util';
import { checkParameter, checkParameterUuid } from 'rf-util';
import { loc, defaultLoc } from 'rf-locale';

export class UserController {
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
    let options = { view: true, limit: 10, offset: 0 };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    const result = await UserService.singleton().getListAndCount(options);

    res.status(200).send(result);
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
      actions: actions,
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
    const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, loc._cf('user', 'UUID'));
    const rowsDeleted = await UserService.singleton().deleteForUuid(uuid);
    if (!rowsDeleted) {
      throw new _HttpError(loc._cf('user', 'User with UUID %s does not exists.'), 403, uuid);
    }

    res.sendStatus(204);
  }

  static async enablePost(req, res) {
    const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, loc._cf('user', 'UUID'));
    const rowsUpdated = await UserService.singleton().enableForUuid(uuid);
    if (!rowsUpdated) {
      throw new _HttpError(loc._cf('user', 'User with UUID %s does not exists.'), 403, uuid);
    }

    res.sendStatus(204);
  }

  static async disablePost(req, res) {
    const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, loc._cf('user', 'UUID'));
    const rowsUpdated = await UserService.singleton().disableForUuid(uuid);
    if (!rowsUpdated) {
      throw new _HttpError(loc._cf('user', 'User with UUID %s does not exists.'), 403, uuid);
    }

    res.sendStatus(204);
  }

  static async patch(req, res) {
    const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, loc._cf('user', 'UUID'));
    const rowsUpdated = await UserService.singleton().updateForUuid(req.body, uuid);
    if (!rowsUpdated) {
      throw new _HttpError(loc._cf('user', 'User with UUID %s does not exists.'), 403, uuid);
    }

    res.sendStatus(204);
  }
}