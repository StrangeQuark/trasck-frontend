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

  getIteration(iterationId) {
    return api.request('get', '/api/v1/iterations/{iterationId}', {
      path: { iterationId },
    });
  },

  updateIteration(iterationId, request) {
    return api.request('patch', '/api/v1/iterations/{iterationId}', {
      path: { iterationId },
      body: request,
    });
  },

  deleteIteration(iterationId) {
    return api.request('delete', '/api/v1/iterations/{iterationId}', {
      path: { iterationId },
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

  getBoard(boardId) {
    return api.request('get', '/api/v1/boards/{boardId}', {
      path: { boardId },
    });
  },

  updateBoard(boardId, request) {
    return api.request('patch', '/api/v1/boards/{boardId}', {
      path: { boardId },
      body: request,
    });
  },

  archiveBoard(boardId) {
    return api.request('delete', '/api/v1/boards/{boardId}', {
      path: { boardId },
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

  updateBoardColumn(boardId, columnId, request) {
    return api.request('patch', '/api/v1/boards/{boardId}/columns/{columnId}', {
      path: { boardId, columnId },
      body: request,
    });
  },

  deleteBoardColumn(boardId, columnId) {
    return api.request('delete', '/api/v1/boards/{boardId}/columns/{columnId}', {
      path: { boardId, columnId },
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

  updateBoardSwimlane(boardId, swimlaneId, request) {
    return api.request('patch', '/api/v1/boards/{boardId}/swimlanes/{swimlaneId}', {
      path: { boardId, swimlaneId },
      body: request,
    });
  },

  deleteBoardSwimlane(boardId, swimlaneId) {
    return api.request('delete', '/api/v1/boards/{boardId}/swimlanes/{swimlaneId}', {
      path: { boardId, swimlaneId },
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

  getRelease(releaseId) {
    return api.request('get', '/api/v1/releases/{releaseId}', {
      path: { releaseId },
    });
  },

  updateRelease(releaseId, request) {
    return api.request('patch', '/api/v1/releases/{releaseId}', {
      path: { releaseId },
      body: request,
    });
  },

  deleteRelease(releaseId) {
    return api.request('delete', '/api/v1/releases/{releaseId}', {
      path: { releaseId },
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

  getRoadmap(roadmapId) {
    return api.request('get', '/api/v1/roadmaps/{roadmapId}', {
      path: { roadmapId },
    });
  },

  updateRoadmap(roadmapId, request) {
    return api.request('patch', '/api/v1/roadmaps/{roadmapId}', {
      path: { roadmapId },
      body: request,
    });
  },

  deleteRoadmap(roadmapId) {
    return api.request('delete', '/api/v1/roadmaps/{roadmapId}', {
      path: { roadmapId },
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

  updateRoadmapItem(roadmapId, roadmapItemId, request) {
    return api.request('patch', '/api/v1/roadmaps/{roadmapId}/items/{roadmapItemId}', {
      path: { roadmapId, roadmapItemId },
      body: request,
    });
  },

  deleteRoadmapItem(roadmapId, roadmapItemId) {
    return api.request('delete', '/api/v1/roadmaps/{roadmapId}/items/{roadmapItemId}', {
      path: { roadmapId, roadmapItemId },
    });
  },
});
