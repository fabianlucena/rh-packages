import { Controller } from 'rh-controller';
import dependency from 'rf-dependency';

export class OAuth2ClientRedirectionController extends Controller {
  path = '/redirection-oauth2';

  constructor() {
    super();
    this.service = dependency.get('oAuth2ClientRedirectionService');
  }

  async get(req) {
    return this.service.loginFromCode(req.query, { loc: req.loc });
  }
}