function draftKey(userId) {
  return 'infologia-certificate-award-drafts:' + userId;
}

export function readAwardDrafts(userId) {
  try {
    const drafts = JSON.parse(localStorage.getItem(draftKey(userId)) || '{}');
    return drafts && typeof drafts === 'object' && !Array.isArray(drafts) ? drafts : {};
  } catch {
    return {};
  }
}

export function writeAwardDraft(userId, groupId, awardId, award) {
  const drafts = readAwardDrafts(userId);
  drafts[groupId] = { ...drafts[groupId], [awardId]: award };
  localStorage.setItem(draftKey(userId), JSON.stringify(drafts));
}

export function mergeAwardDrafts(groups, drafts) {
  return groups.map(group => {
    const changes = drafts[group.id];
    if (!changes || typeof changes !== 'object') return group;
    const awards = Array.isArray(group.certificateAwards) ? group.certificateAwards : [];
    const byId = new Map(awards.filter(award => award && typeof award.id === 'string').map(award => [award.id, award]));
    for (const [id, award] of Object.entries(changes)) {
      if (award === null) byId.delete(id);
      else if (award && award.id === id) byId.set(id, award);
    }
    return { ...group, certificateAwards: [...byId.values()] };
  });
}

export function acknowledgeAwardDrafts(userId, savedGroups) {
  const drafts = readAwardDrafts(userId);
  for (const [groupId, changes] of Object.entries(drafts)) {
    const group = savedGroups.find(item => item.id === groupId);
    if (!group) {
      continue;
    }
    const awards = Array.isArray(group.certificateAwards) ? group.certificateAwards : [];
    for (const [id, draft] of Object.entries(changes)) {
      const saved = awards.find(award => award?.id === id) || null;
      if (JSON.stringify(saved) === JSON.stringify(draft)) delete changes[id];
    }
    if (Object.keys(changes).length === 0) delete drafts[groupId];
  }
  try {
    localStorage.setItem(draftKey(userId), JSON.stringify(drafts));
  } catch {
    // The saved workspace remains available in the cloud.
  }
}

export function makeAwardId({ week, month, period, category, students }) {
  const names = students.map(student => student.name.trim().toLocaleLowerCase('kk')).sort();
  const parts = [period, period === 'Айлық' ? month : '', week, category, ...names];
  return parts.map(part => encodeURIComponent(String(part ?? ''))).join(':');
}
