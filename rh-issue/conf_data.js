import {loc} from 'rf-util';

const name = 'rhIssue';

export const data = {
    roles: [
        {name: 'issueManager', title: loc._cf('role', 'Issue manager'), isTranslatable: true, ownerModule: name},
    ],

    rolesParentsSites: [
        {role: 'admin', parent: 'issueManager', site: 'system', ownerModule: name},
    ],

    permissions: [
        {name: 'issue.get',    title: loc._cf('permission', 'Get issues'),    isTranslatable: true, roles: 'issueManager', ownerModule: name, menuItem: {label: loc._cf('menu', 'Issues'), isTranslatable: true, icon: 'issue', action: 'grid', service: 'issue'}},
        {name: 'issue.create', title: loc._cf('permission', 'Create issues'), isTranslatable: true, roles: 'issueManager', ownerModule: name,},
        {name: 'issue.edit',   title: loc._cf('permission', 'Edit issues'),   isTranslatable: true, roles: 'issueManager', ownerModule: name,},
        {name: 'issue.delete', title: loc._cf('permission', 'Delete issues'), isTranslatable: true, roles: 'issueManager', ownerModule: name,},
    ],

    issuesTypes: [
        {name: 'task', title: loc._cf('issue', 'Task'), isTranslatable: true, description: loc._cf('issue', 'The issue is a normal task.')},
        {name: 'bug',  title: loc._cf('issue', 'Bug'),  isTranslatable: true, description: loc._cf('issue', 'The issue is a bug report.')},
    ],

    issuesPriorities: [
        {name: 'trivial',   title: loc._cf('issue', 'Trivial'),   isTranslatable: true, description: loc._cf('issue', 'The issue is not important and can be postponed without problems.')},
        {name: 'desirable', title: loc._cf('issue', 'Desirable'), isTranslatable: true, description: loc._cf('issue', 'The issue is not important but it would be nice if the task is done.')},
        {name: 'important', title: loc._cf('issue', 'Important'), isTranslatable: true, description: loc._cf('issue', 'The issue is important and must be solved.')},
        {name: 'urgent',    title: loc._cf('issue', 'Urgent'),    isTranslatable: true, description: loc._cf('issue', 'The issue is very important and must be resolved as soon as possible..')},
        {name: 'blocker',   title: loc._cf('issue', 'Blocker'),   isTranslatable: true, description: loc._cf('issue', 'Company productivity has stopped until this is resolved.')},
    ],

    issuesStatuses: [
        {name: 'open',   title: loc._cf('issue', 'Open'),   isTranslatable: true, description: loc._cf('issue', 'The issue is open.')},
        {name: 'closed', title: loc._cf('issue', 'Closed'), isTranslatable: true, description: loc._cf('issue', 'The issue is closed.'), isClosed: true},
    ],

    issuesCloseReasons: [
        {name: 'resolved',   title: loc._cf('issue', 'Resolved'),    isTranslatable: true, description: loc._cf('issue', 'The issue was closed because the problem was solved.')},
        {name: 'discarded',  title: loc._cf('issue', 'Discarded'),   isTranslatable: true, description: loc._cf('issue', 'The issue was closed because the problem was discarded and will not be worked on.')},
        {name: 'duplicated', title: loc._cf('issue', 'Duplicated'),  isTranslatable: true, description: loc._cf('issue', 'The issue was closed because is duplicated in another issue.')},
        {name: 'workForMe',  title: loc._cf('issue', 'Work for me'), isTranslatable: true, description: loc._cf('issue', 'The issue was closed because it was checked and work properly so don\'t need work on it.')},
    ],

    issuesWorkflows: [
        {name: 'minimalist', title: loc._cf('issue', 'Minimalist'), isTranslatable: true, description: loc._cf('issue', 'The minimalist workflow only support open and close status.')},
    ],

    issuesTransitions: [
        {name: 'close', workflow: 'minimalist', from: 'open', to: 'closed', title: loc._cf('issue', 'Close'), isTranslatable: true, description: loc._cf('issue', 'Close a ticket.')},
    ],
};
