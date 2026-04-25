export const loadProjectWorkItems = async (services, projectId, maxItems = 250) => {
  const items = [];
  let cursor = '';
  while (items.length < maxItems) {
    const page = await services.workItems.listByProject(projectId, {
      limit: Math.min(100, maxItems - items.length),
      ...(cursor ? { cursor } : {}),
    });
    const loadedItems = Array.isArray(page?.items) ? page.items : [];
    items.push(...loadedItems);
    if (!page?.hasMore || !page?.nextCursor) {
      break;
    }
    cursor = page.nextCursor;
  }
  return items;
};

export const loadIterationScopes = async (planningService, iterations) => {
  const scopeEntries = await Promise.all((iterations || []).map(async (iteration) => [
    iteration.id,
    await planningService.listIterationWorkItems(iteration.id),
  ]));
  return new Map(scopeEntries.map(([iterationId, rows]) => [
    iterationId,
    new Set((rows || []).filter((row) => !row.removedAt).map((row) => row.workItemId)),
  ]));
};

export const groupIterationsByStatus = (iterations) => {
  const grouped = { active: [], planned: [], closed: [], cancelled: [], other: [] };
  for (const iteration of iterations || []) {
    if (grouped[iteration.status]) {
      grouped[iteration.status].push(iteration);
    } else {
      grouped.other.push(iteration);
    }
  }
  return grouped;
};

export const pickPrimaryIteration = (iterations) => (
  (iterations || []).find((iteration) => iteration.status === 'active')
  || (iterations || []).find((iteration) => iteration.status === 'planned')
  || (iterations || [])[0]
  || null
);

export const pickPreferredBoard = (boards, iteration) => {
  const rows = Array.isArray(boards) ? boards : [];
  if (rows.length === 0) {
    return null;
  }
  const scrumBoards = rows.filter((board) => board.type === 'scrum');
  const candidateBoards = scrumBoards.length > 0 ? scrumBoards : rows;
  if (iteration?.teamId) {
    return candidateBoards.find((board) => board.teamId === iteration.teamId)
      || candidateBoards.find((board) => !board.teamId)
      || candidateBoards[0];
  }
  return candidateBoards[0];
};

export const countScopedWorkItems = (iterationScopes, iterationId) => iterationId ? (iterationScopes.get(iterationId)?.size || 0) : 0;

export const iterationLabel = (iteration, teamsById = new Map()) => {
  if (!iteration) {
    return 'No iteration selected';
  }
  const team = iteration.teamId ? teamsById.get(iteration.teamId) : null;
  const dates = [iteration.startDate, iteration.endDate].filter(Boolean).join(' to ');
  return [iteration.name, team?.name, dates].filter(Boolean).join(' | ');
};

export const idsInAnyIteration = (iterationScopes) => {
  const result = new Set();
  for (const ids of iterationScopes.values()) {
    for (const id of ids) {
      result.add(id);
    }
  }
  return result;
};
