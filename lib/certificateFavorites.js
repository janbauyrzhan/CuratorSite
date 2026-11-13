function keyFor(userId) {
  return 'infologia-certificate-favorite-drafts:' + userId;
}

export function readFavoriteDrafts(userId) {
  try {
    const drafts = JSON.parse(localStorage.getItem(keyFor(userId)) || '{}');
    return drafts && typeof drafts === 'object' && !Array.isArray(drafts) ? drafts : {};
  } catch {
    return {};
  }
}

export function writeFavoriteDraft(userId, id, favorite) {
  const drafts = readFavoriteDrafts(userId);
  drafts[id] = favorite;
  localStorage.setItem(keyFor(userId), JSON.stringify(drafts));
}

export function mergeFavoriteDrafts(saved, drafts) {
  const favorites = new Set(Array.isArray(saved) ? saved.filter(id => typeof id === 'string') : []);
  for (const [id, favorite] of Object.entries(drafts)) {
    if (favorite === true) favorites.add(id);
    if (favorite === false) favorites.delete(id);
  }
  return [...favorites];
}

export function acknowledgeFavoriteDrafts(userId, saved) {
  const drafts = readFavoriteDrafts(userId);
  const favorites = new Set(saved);
  for (const [id, favorite] of Object.entries(drafts)) {
    if (favorites.has(id) === favorite) delete drafts[id];
  }
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(drafts));
  } catch {
    // The saved workspace remains available in the cloud.
  }
}
