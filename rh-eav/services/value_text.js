import {EavAttributeService} from './attribute.js';
import {conf} from '../conf.js';
import {ServiceIdUuid} from 'rf-service';

export class EavValueTextService extends ServiceIdUuid {
    sequelize = conf.global.sequelize;
    model = conf.global.models.EavValueText;
    references = {
        modelEntityName: conf.global?.services?.ModelEntityNameService?.singleton(),
        attributeType: EavAttributeService.singleton(),
    };

    constructor() {
        if (!conf?.global?.services?.ModelEntityName?.singleton) {
            throw new Error('There is no ModelEntityName service. Try adding RH Model Entity Name module to the project.');
        }

        super();
    }
}