import { Service } from 'rf-service';

export class LogService extends Service.Id {
  references = {
    session: { attributes: ['id'] },
    user: { attributes: ['username', 'displayName'] },
  };

  async validateForCreation(data) {
    if (data.ref !== undefined && isNaN(data.ref)) {
      delete data.ref;
    }
        
    return super.validateForCreation(data);
  }

  async getMaxRef() {
    const sequelize = this.sequelize;
    const result = await this.model.findAll({ attributes:[[sequelize.fn('max', sequelize.col('ref')), 'maxRef']] });
    if (!result?.length) {
      return;
    }

    const row = result[0];
    const maxRef = row.maxRef;

    return maxRef;
  }
}