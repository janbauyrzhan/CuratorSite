// A user-scoped write-ahead journal protects edits made just before reload/offline.
export function readPlanDrafts(userId) {
  try { return JSON.parse(localStorage.getItem(`infologia-plan-drafts:${userId}`)||'{}'); } catch { return {}; }
}
export function writePlanDraft(userId,gid,week,plan,subject='informatics') {
  const drafts=readPlanDrafts(userId);
  drafts[`${subject}:${gid}:${week}`]={gid,week,plan,subject};
  localStorage.setItem(`infologia-plan-drafts:${userId}`,JSON.stringify(drafts));
}
export function mergePlanDrafts(groups,drafts) {
  return groups.map(group=>{
    const entries=Object.values(drafts).filter(d=>d.gid===group.id);
    if(!entries.length)return group;
    const weeklyPlans={...group.weeklyPlans};
    entries.forEach(d=>{const subject=d.subject||'informatics';weeklyPlans[subject]={...weeklyPlans[subject],[d.week]:d.plan};});
    return {...group,weeklyPlans};
  });
}
export function acknowledgePlanDrafts(userId,savedGroups) {
  const drafts=readPlanDrafts(userId);
  for(const [key,draft] of Object.entries(drafts)) {
    const saved=savedGroups.find(g=>g.id===draft.gid)?.weeklyPlans?.[draft.subject||'informatics']?.[draft.week];
    if(JSON.stringify(saved)===JSON.stringify(draft.plan))delete drafts[key];
  }
  try {localStorage.setItem(`infologia-plan-drafts:${userId}`,JSON.stringify(drafts));}catch{}
}
