import { Service } from 'rf-service';
import { checkDataForMissingProperties } from 'sql-util';

export class ShareService extends Service.EnableOwnerModuleTranslatable {
  references = {
    objectName: {
      service: 'modelEntityNameService',
      createIfNotExists: true,
    },
    user: true,
    type: { service: 'shareTypeService' },
  };
    
  async validateForCreation(data) {
    await checkDataForMissingProperties(data, 'Share', 'objectNameId', 'objectId', 'userId', 'typeId');
    return super.validateForCreation(data);
  }

  /**
   * Creates a new share type row into DB if not exists.
   * @param {data} data - data for the new share type @see create.
   * @returns {Promise{ShareType}}
   */
  async createIfNotExists(data, options) {
    data = this.completeReferences(data, options);
    await checkDataForMissingProperties(data, 'Share', 'objectNameId', 'objectId', 'userId', 'typeId');

    const rows = await ShareService.getList(
      {
        where: {
          objectNameId: data.objectNameId,
          objectId: data.objectId,
          userId: data.userId,
          typeId: data.typeId,
        }
      },
      {
        attributes: ['id'],
        skipNoRowsError: true,
        ...options,
      }
    );
    if (rows?.length) {
      return rows[0];
    }

    return ShareService.create(data);
  }

  async deleteForModelEntityNameAndId(modelEntityName, objectId) {
    const objectNameId = await this.references.ObjectName.getSingleIdForName(modelEntityName);
    return this.deleteFor({ objectNameId, objectId });
  }
}