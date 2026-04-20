export const createPlanningService = (api) => ({
  listTeams(workspaceId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/teams', {
      path: { workspaceId },
    });
  },

  createTeam(workspaceId, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/teams', {
      path: { workspaceId },
      body: request,
    });
  },

  listProjectTeams(projectId) {
    return api.request('get', '/api/v1/projects/{projectId}/teams', {
      path: { projectId },
    });
  },

  assignProjectTeam(projectId, teamId, request) {
    return api.request('put', '/api/v1/projects/{projectId}/teams/{teamId}', {
      path: { projectId, teamId },
      body: request,
    });
  },

  listIterations(projectId) {
    return api.request('get', '/api/v1/projects/{projectId}/iterations', {
      path: { projectId },
    });
  },

  createIteration(projectId, request) {
    return api.request('post', '/api/v1/projects/{projectId}/iterations', {
      path: { projectId },
      body: request,
    });
  },

  commitIteration(iterationId, request) {
    return api.request('post', '/api/v1/iterations/{iterationId}/commit', {
      path: { iterationId },
      body: request,
    });
  },

  listBoards(projectId) {
    return api.request('get', '/api/v1/projects/{projectId}/boards', {
      path: { projectId },
    });
  },

  createBoard(projectId, request) {
    return api.request('post', '/api/v1/projects/{projectId}/boards', {
      path: { projectId },
      body: request,
    });
  },

  listBoardWorkItems(boardId, query = {}) {
    return api.request('get', '/api/v1/boards/{boardId}/work-items', {
      path: { boardId },
      query,
    });
  },

  listBoardColumns(boardId) {
    return api.request('get', '/api/v1/boards/{boardId}/columns', {
      path: { boardId },
    });
  },

  createBoardColumn(boardId, request) {
    return api.request('post', '/api/v1/boards/{boardId}/columns', {
      path: { boardId },
      body: request,
    });
  },

  listBoardSwimlanes(boardId) {
    return api.request('get', '/api/v1/boards/{boardId}/swimlanes', {
      path: { boardId },
    });
  },

  createBoardSwimlane(boardId, request) {
    return api.request('post', '/api/v1/boards/{boardId}/swimlanes', {
      path: { boardId },
      body: request,
    });
  },

  listReleases(projectId) {
    return api.request('get', '/api/v1/projects/{projectId}/releases', {
      path: { projectId },
    });
  },

  createRelease(projectId, request) {
    return api.request('post', '/api/v1/projects/{projectId}/releases', {
      path: { projectId },
      body: request,
    });
  },

  listReleaseWorkItems(releaseId) {
    return api.request('get', '/api/v1/releases/{releaseId}/work-items', {
      path: { releaseId },
    });
  },

  addReleaseWorkItem(releaseId, request) {
    return api.request('post', '/api/v1/releases/{releaseId}/work-items', {
      path: { releaseId },
      body: request,
    });
  },

  listProjectRoadmaps(projectId) {
    return api.request('get', '/api/v1/projects/{projectId}/roadmaps', {
      path: { projectId },
    });
  },

  listWorkspaceRoadmaps(workspaceId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/roadmaps', {
      path: { workspaceId },
    });
  },

  createRoadmap(workspaceId, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/roadmaps', {
      path: { workspaceId },
      body: request,
    });
  },

  listRoadmapItems(roadmapId) {
    return api.request('get', '/api/v1/roadmaps/{roadmapId}/items', {
      path: { roadmapId },
    });
  },

  createRoadmapItem(roadmapId, request) {
    return api.request('post', '/api/v1/roadmaps/{roadmapId}/items', {
      path: { roadmapId },
      body: request,
    });
  },
});
