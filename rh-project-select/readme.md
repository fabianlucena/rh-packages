# RH Project Select

This package add endpoints for project selection. It needs a project service
in order to get the projects, and selecting.

If the projects are awned by a Company and the comapny is selected first the 
following adicional configurations is needed:
{
  queryParams: { companyUuid = 'companyUuid' },
  requestFilters: {
    companyUuid: { request: 'companyUuid' },
    companyId: getCurrentCompanyIdForRequest,
  },
  checkFunction: (project, req) => {
    if (req.roles.includes('admin')) {
      return true;
    }

    const companyId = await conf.filters.getCurrentCompanyId(req);
    return companyId === project.companyId;
  }
}