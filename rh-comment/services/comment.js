import { ServiceIdUuid } from 'rf-service';

export class CommentService extends ServiceIdUuid {
  references = {
    modelEntityName: true,
    commentType: true,
    user: { view: true },
  };
  viewAttributes = ['id', 'uuid', 'comment', 'createdAt'];
}