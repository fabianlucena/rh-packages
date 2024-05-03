import { ServiceIdUuidEnabledOwnerModule, Op } from 'rf-service';
import dependency from 'rf-dependency';

export class GroupService extends ServiceIdUuidEnabledOwnerModule {
  model = 'userModel';
  references = {
    type: 'userTypeService',
    user: {
      whereColumn: 'username',
    },
  };
  searchColumns = ['username', 'displayName'];
  viewAttributes = ['uuid', 'isEnabled', 'username', 'displayName'];

  init() {
    super.init();

    this.userGroupService = dependency.get('userGroupService');
  }

  async validateForCreation(data) {
    data ??= {};
    if (!data.typeId && !data.type) {
      data.type = 'group';
    }

    return super.validateForCreation(data);
  }

  /**
   * Creates a new Groups row into DB if not exists.
   * @param {data} data - data for the new Role @see create.
   * @returns {Promise{Role}}
   */
  async createIfNotExists(data, options) {
    const row = await this.getForUsername(data.username, { attributes: ['id'], foreign: { module: { attributes:[] }}, skipNoRowsError: true, ...options });
    if (row) {
      return row;
    }

    return this.create(data);
  }

  /**
   * Gets a group for its username. For many coincidences and for no rows this method fails.
   * @param {string} username - username for the group to get.
   * @param {Options} options - Options for the @ref getList method.
   * @returns {Promise{Group}}
   */
  async getForUsername(username, options) {
    options = {
      ...options,
      where: {
        ...options?.where,
        username,
      },
    };

    if (Array.isArray(username)) {
      return this.getList(options);
    }

    return this.getSingle(options);
  }

  /**
   * Gets a group ID for its username. For many coincidences and for no rows this method fails.
   * @param {string} username - username for the group to get.
   * @param {Options} options - Options for the @ref getList method.
   * @returns {Promise{Permission}}
   */
  async getIdForUsername(username, options) {
    return (await this.getForUsername(username, { ...options, attributes: ['id'] })).id;
  }

  /**
   * Gets the direct (first level) groups for a given group username.
   * @param {string} username - username for the group to retrive its parent groups.
   * @param {Options} options - Options for the @ref getList method.
   * @returns {Promise{GroupList}}
   */
  async getParentsForUsername(username, options) {
    return this.userGroupService.getForUsername(username, options);
  }

  /**
   * Gets the direct (first level) group usernames for a given group username.
   * @param {string} username - username for the group to retrive its parents group usernames.
   * @param {Options} options - Options for the @ref getList method.
   * @returns {Promise{[]string}}
   */
  async getParentsNameForUsername(username, options) {
    const rowList = await this.getParentsForUsername(username, { ...options, attributes: ['username'], skipThroughAssociationAttributes: true });
    return rowList.map(row => row.username);
  }

  /**
   * Gets all of the groups ID for a given group username and.
   * @param {string} username - username for the group to retrive its parents group ID.
   * @param {Options} options - Options for the @ref getList method.
   * @returns {Promise{GroupList}}
   */
  async getAllIdsForUsername(username, options) {
    const isEnabled = options?.isEnabled ?? true;

    const parentOptions = {
      ...options,
      attributes: ['groupId'],
    };
        
    let newGroupList = await this.getParentsForUsername(
      username,
      {
        isEnabled,
        attributes: ['groupId'],
        skipAssociationAttributes: true,
      }
    );
    let allGroupIdList = await newGroupList.map(group => group.id);
    let newGroupIdList = allGroupIdList;
        
    while (newGroupList.length) {
      parentOptions.where.userId = { [Op.in]: newGroupIdList };
      parentOptions.where.groupId = { [Op.notIn]: allGroupIdList };

      newGroupList = await this.userGroupService.getList(parentOptions);
      if (!newGroupList?.length) {
        break;
      }

      newGroupIdList = await newGroupList.map(group => group.groupId);
      allGroupIdList = [...allGroupIdList, ...newGroupIdList];
    }

    return allGroupIdList;
  }

  /**
   * Gets all of the groups for a given username.
   * @param {string} username - username for the user to retrive its groupss.
   * @param {Options} options - Options for the @ref getList method.
   * @returns {Promise{GroupList}}
   */
  async getAllForUsername(username, options) {
    const groupIdList = await this.getAllIdsForUsername(username);
    return this.getList({ ...options, where: { ...options?.where, id: groupIdList }});
  }

  /**
   * Gets all of the group names for a given username and site name.
   * @param {string} username - username for the user to retrive its groups.
   * @param {Options} options - Options for the @ref getList method.
   * @returns {Promise{[]string}}
   */
  async getAllNamesForUsername(username, options) {
    if (!username) {
      return [];
    }
            
    const groupsList = await this.getAllForUsername(username, { ...options, attributes: ['username'], skipThroughAssociationAttributes: true });
    return Promise.all(await groupsList.map(group => group.username));
  }
}