import { Controller } from 'rh-controller';
import dependency from 'rf-dependency';
import { getOptionsFromParamsAndOData, makeContext } from 'http-util';
import { conf } from '../conf.js';
import { defaultLoc } from 'rf-locale';
import { HttpError } from 'rf-error';

export class GroupController extends Controller {
  constructor() {
    super();
    this.service = dependency.get('groupService');
    this.userGroupService = dependency.get('userGroupService');
    this.userService = dependency.get('userService');
  }

  postEnableForUuidPermission =  'group.edit';
  postDisableForUuidPermission = 'group.edit';

  getPermission = 'group.get';
  async getData(req) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = {
      view: true,
      limit:  30,
      offset:  0,
      where: {
        type: {
          name: 'group'
        }
      },
      loc,
    };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    if (options.attributes) options.attributes = [...options.attributes, 'id'];
    else options.attributes = ['id'];

    let result = await this.service.getListAndCount(options);

    for (const row of result.rows) {
      row.users = 
        (await this.userGroupService.getList({ include: { user: true }, where: { groupId: row.id }}))
          .map(userGroup => userGroup.user);
      delete row.id;
    }
    
    return result;
  }

  postPermission = 'group.create';
  async post(req, res) {
    const data = { ...req.body, type: 'group' };
    const context = makeContext(req, res);

    const row = await this.service.create(data, { context });

    for (const userUuid of data.users) {
      await this.userGroupService.create({
        groupId: row.id,
        user: { uuid: userUuid },
      });
    }
  }

  patchPermission = 'group.edit';
  patchForUuidPermission = 'group.edit';
  async patch(req, res) {
    const context = makeContext(req, res);
    const { uuid } = await this.checkUuid(context);
    const data = { ...req.body };

    delete data.uuid;
    await this.service.updateForUuid(data, uuid, { context });

    if (data.users) {
      const groupId = await this.service.getSingleIdForUuid(uuid);

      const existingUserUuids = 
        (await this.userGroupService.getList({ include: { user: { attributes: ['uuid'] }}, where: { groupId }}))
          .map(userGroup => userGroup.user.uuid);

      const newUsers = data.users.filter(u => !existingUserUuids.includes(u));
      const removedUsers = existingUserUuids.filter(u => !data.users.includes(u));

      for (const newUserUuid of newUsers) {
        await this.userGroupService.create({
          groupId,
          user: { uuid: newUserUuid },
        });
      }

      await this.userGroupService.deleteFor({
        groupId,
        user: { uuid: removedUsers },
      });
    }
  }

  deleteForUuidPermission = 'group.delete';
  async delete(req, res) {
    const context = makeContext(req, res);
    const { uuid } = await this.checkUuid(context);

    await this.userGroupService.deleteFor({
      group: { uuid }
    });

    const rowsDeleted = await this.service.deleteForUuid(uuid);
    if (!rowsDeleted) {
      throw new HttpError(loc => loc._c('group', 'Group with UUID %s does not exist.'), 403, uuid);
    }
  }

  'getPermission /users' = 'group.edit';
  async 'get /users'(req, res) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = {
      view: true,
      limit: 100,
      offset: 0,
      loc
    };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    if (conf.filters?.projectId) {
      options.where ??= {};
      options.where.projectId = await conf.filters.projectId(makeContext(req, res)) ?? null;
    }

    const result = await this.userService.getListAndCount(options);

    res.status(200).send(result);
  }
}