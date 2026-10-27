// A user-scoped write-ahead journal protects edits made just before reload/offline.
export function readPlanDrafts(userId) {
  try { return JSON.parse(localStorage.getItem(`infologia-plan-drafts:${userId}`)||'{}'); } catch { return {}; }
}
export function writePlanDraft(userId,gid,week,plan) {
  const drafts=readPlanDrafts(userId);
  drafts[`${gid}:${week}`]={gid,week,plan};
  localStorage.setItem(`infologia-plan-drafts:${userId}`,JSON.stringify(drafts));
}
export function mergePlanDrafts(groups,drafts) {
  return groups.map(group=>{
    const entries=Object.values(drafts).filter(d=>d.gid===group.id);
    if(!entries.length)return group;
    const plans={...group.weeklyPlans?.informatics};
    entries.forEach(d=>{plans[d.week]=d.plan;});
    return {...group,weeklyPlans:{...group.weeklyPlans,informatics:plans}};
  });
}
export function acknowledgePlanDrafts(userId,savedGroups) {
  const drafts=readPlanDrafts(userId);
  for(const [key,draft] of Object.entries(drafts)) {
    const saved=savedGroups.find(g=>g.id===draft.gid)?.weeklyPlans?.informatics?.[draft.week];
    if(JSON.stringify(saved)===JSON.stringify(draft.plan))delete drafts[key];
  }
  try {localStorage.setItem(`infologia-plan-drafts:${userId}`,JSON.stringify(drafts));}catch{}
}
