import {conf} from '../conf.js';
import {EntityTagService} from 'rh-tag';

export class ProjectTagService extends EntityTagService {
    constructor() {
        super({
            sequelize: conf.global.sequelize,
            Sequelize: conf.global.Sequelize,
            models: conf.global.models,
            model: conf.global.models.ProjectTag,
            entityName: 'project',
            entityId: 'projectId',
            entityModel: conf.global.models.Project,
            tagCategory: conf.tagCategory,
        });
    }
}