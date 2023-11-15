import {conf} from '../conf.js';
import {ServiceIdUuidName} from 'rf-service';

export class EavEntityTypeService extends ServiceIdUuidName {
    sequelize = conf.global.sequelize;
    model = conf.global.models.EavEntityType;
}