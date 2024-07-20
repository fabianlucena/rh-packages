import { Controller } from 'rh-controller';
import dependency from 'rf-dependency';

export class PerspectiveController extends Controller {
  constructor() {
    super();

    this.service = dependency.get('perspectiveService');
  }

  postPermission =               'perspective.create';
  getPermission =                'perspective.get';
  deleteForUuidPermission =      'perspective.delete';
  postEnableForUuidPermission =  'perspective.edit';
  postDisableForUuidPermission = 'perspective.edit';
  patchForUuidPermission =       'perspective.edit';
}