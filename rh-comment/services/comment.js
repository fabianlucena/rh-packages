import { Service } from 'rf-service';

export class CommentService extends Service.IdUuid {
  references = {
    modelEntityName: true,
    commentType: true,
    user: { view: true },
  };
  viewAttributes = ['id', 'uuid', 'comment', 'createdAt'];
}