'use strict';

import {MemberController} from '../controllers/member.js';
import {methodNotAllowed, corsSimplePreflight, asyncHandler} from 'http-util';

export default (app, checkPermission) => {
    app.options('/member', corsSimplePreflight('GET,HEAD,POST,PATCH,DELETE'));
    app.options('/member/:uuid', corsSimplePreflight('GET,HEAD,PATCH,DELETE'));
    app.options('/member/enable', corsSimplePreflight('POST'));
    app.options('/member/enable/:uuid', corsSimplePreflight('POST'));
    app.options('/member/disable', corsSimplePreflight('POST'));
    app.options('/member/disable/:uuid', corsSimplePreflight('POST'));
    app.options('/member-role', corsSimplePreflight('GET'));
    
    app.post('/member', checkPermission('member.create'), asyncHandler(MemberController, 'post'));
    app.get('/member', checkPermission('member.get'), asyncHandler(MemberController, 'get'));

    app.get('/member/:uuid', checkPermission('member.get'), asyncHandler(MemberController, 'get'));

    app.delete('/member', checkPermission('member.delete'), asyncHandler(MemberController, 'delete'));
    app.delete('/member/:uuid', checkPermission('member.delete'), asyncHandler(MemberController, 'delete'));

    app.post('/member/enable', checkPermission('member.edit'), asyncHandler(MemberController, 'enablePost'));
    app.post('/member/enable/:uuid', checkPermission('member.edit'), asyncHandler(MemberController, 'enablePost'));
    
    app.post('/member/disable', checkPermission('member.edit'), asyncHandler(MemberController, 'disablePost'));
    app.post('/member/disable/:uuid', checkPermission('member.edit'), asyncHandler(MemberController, 'disablePost'));
    
    app.patch('/member', checkPermission('member.edit'), asyncHandler(MemberController, 'patch'));
    app.patch('/member/:uuid', checkPermission('member.edit'), asyncHandler(MemberController, 'patch'));

    app.get('/member-role', checkPermission('member.edit'), asyncHandler(MemberController, 'getRoles'));

    app.all('/member', methodNotAllowed);
    app.all('/member-role', methodNotAllowed);
};


