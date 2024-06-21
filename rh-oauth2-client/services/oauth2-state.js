import { ServiceIdUuid } from 'rf-service';
import crypto from 'crypto';

export class OAuth2StateService extends ServiceIdUuid {
  async validateForCreation(data) {
    data = { ...data };

    if (data.state === undefined) {
      data.state = crypto.randomBytes(32)
        .toString('base64')
        .replaceAll('=', '')
        .replaceAll('+', '-')
        .replaceAll('/', '_');
    }

    return super.validateForCreation(data);
  }
}