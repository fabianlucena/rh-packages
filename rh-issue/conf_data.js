import { loc } from 'rf-locale';

const name = 'rhIssue';

export const data = {
  roles: [
    { name: 'issueManager', title: loc._cf('role', 'Issue manager'), isTranslatable: true, ownerModule: name },
  ],

  rolesParentsSites: [
    { role: 'admin', parent: 'issueManager', site: 'system', ownerModule: name },
  ],

  permissions: [
    { name: 'issue.get',    title: loc._cf('permission', 'Get issues'),    isTranslatable: true, roles: 'issueManager', ownerModule: name, menuItem: { label: loc._cf('menu', 'Issues'), isTranslatable: true, icon: 'issue', action: 'grid', service: 'issue' }},
    { name: 'issue.create', title: loc._cf('permission', 'Create issues'), isTranslatable: true, roles: 'issueManager', ownerModule: name, },
    { name: 'issue.edit',   title: loc._cf('permission', 'Edit issues'),   isTranslatable: true, roles: 'issueManager', ownerModule: name, },
    { name: 'issue.delete', title: loc._cf('permission', 'Delete issues'), isTranslatable: true, roles: 'issueManager', ownerModule: name, },
  ],

  issueTypes: [
    { name: 'task', title: loc._cf('issue', 'Task'), isTranslatable: true, translationContext: 'issue', description: loc._cf('issue', 'The issue is a normal task.') },
    { name: 'bug',  title: loc._cf('issue', 'Bug'),  isTranslatable: true, translationContext: 'issue', description: loc._cf('issue', 'The issue is a bug report.') },
  ],

  issuePriorities: [
    { name: 'trivial',   title: loc._cf('issue', 'Trivial'),   isTranslatable: true, translationContext: 'issue', description: loc._cf('issue', 'The issue is not important and can be postponed without problems.') },
    { name: 'desirable', title: loc._cf('issue', 'Desirable'), isTranslatable: true, translationContext: 'issue', description: loc._cf('issue', 'The issue is not important but it would be nice if the task is done.') },
    { name: 'important', title: loc._cf('issue', 'Important'), isTranslatable: true, translationContext: 'issue', description: loc._cf('issue', 'The issue is important and must be solved.') },
    { name: 'urgent',    title: loc._cf('issue', 'Urgent'),    isTranslatable: true, translationContext: 'issue', description: loc._cf('issue', 'The issue is very important and must be resolved as soon as possible..') },
    { name: 'blocker',   title: loc._cf('issue', 'Blocker'),   isTranslatable: true, translationContext: 'issue', description: loc._cf('issue', 'Company productivity has stopped until this is resolved.') },
  ],

  issueCloseReasons: [
    { name: 'resolved',   title: loc._cf('issue', 'Resolved'),    isTranslatable: true, translationContext: 'issue', description: loc._cf('issue', 'The issue was closed because the problem was solved.') },
    { name: 'discarded',  title: loc._cf('issue', 'Discarded'),   isTranslatable: true, translationContext: 'issue', description: loc._cf('issue', 'The issue was closed because the problem was discarded and will not be worked on.') },
    { name: 'duplicated', title: loc._cf('issue', 'Duplicated'),  isTranslatable: true, translationContext: 'issue', description: loc._cf('issue', 'The issue was closed because is duplicated in another issue.') },
    { name: 'workForMe',  title: loc._cf('issue', 'Work for me'), isTranslatable: true, translationContext: 'issue', description: loc._cf('issue', 'The issue was closed because it was checked and work properly so don\'t need work on it.') },
  ],

  issueRelationships: [
    {
      name:               'related',
      title:              loc._cf('issue', 'Related'),
      isTranslatable:     1,
      translationContext: 'issue',
    },
  ],

  workflows: [
    {
      name:               'issueMinimalistic',
      title:              loc._cf('issue', 'Minimalist for issues'),
      isTranslatable:     true,
      translationContext: 'issue',
      ownerModule:        name,
      modelEntityName:    'Issue',
      modelUuidProperty:  'uuid',
      workflowName:       'workflow',
      workflowTitle:      loc._cf('issue', 'Workflow'),
      currentStatusName:  'statuses',
      currentStatusTitle: loc._cf('issue', 'Statuses'),
      assigneeName:       'assignees',
      assigneeTitle:      loc._cf('issue', 'Assignees'),
      workflow: {
        name: 'minimalist',
        title: loc._cf('issue', 'Minimalist'),
        isTranslatable: true,
        translationContext: 'issue',
        description: loc._cf('issue', 'The minimalist workflow only support open and close status.'),
        statuses: [
          {
            name: 'open',
            title: loc._cf('issue', 'Open'),
            isTranslatable: true,
            translationContext: 'issue',
            description: loc._cf('issue', 'The issue is open.'),
            isInitial: true,
          },
          {
            name: 'closed',
            title: loc._cf('issue', 'Closed'),
            isTranslatable: true,
            translationContext: 'issue',
            description: loc._cf('issue', 'The issue is closed.'),
            isFinal: true,
          },        
        ],
        transitions: [
          {
            name: 'close',
            from: 'open',
            to: 'closed',
            title: loc._cf('issue', 'Close'),
            isTranslatable: true,
            translationContext: 'issue',
            description: loc._cf('issue', 'Close a ticket.'),
          },
        ],
      },
    },
  ],
};
