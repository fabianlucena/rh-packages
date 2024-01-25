import {conf} from '../conf.js';
import {ServiceIdUuidName} from 'rf-service';

export class CommentEntityTypeService extends ServiceIdUuidName {
    sequelize = conf.global.sequelize;
    model = conf.global.models.CommentEntityType;
}