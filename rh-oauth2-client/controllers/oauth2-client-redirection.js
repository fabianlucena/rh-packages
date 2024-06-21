import { Controller } from 'rh-controller';
import dependency from 'rf-dependency';

export class OAuth2ClientRedirectionController extends Controller {
  path = '/redirection-oauth2';

  constructor() {
    super();
    this.service = dependency.get('oAuth2ClientService');
  }

  async get(req) {
    console.log(req.query);
    
    return 'Hola Mundo! 04';
  }
}