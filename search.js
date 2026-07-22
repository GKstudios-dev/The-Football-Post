/* =========================================================
   SEARCH — a word has to START WITH the query, not just contain
   it anywhere (same rule the app uses). Checks title, snippet,
   category, and tags.
   ========================================================= */
function wordStartsWith(text, query){
  if(!text) return false;
  const words = String(text).toLowerCase().split(/[^a-z0-9]+/);
  return words.some(w=> w.startsWith(query));
}
function matchesSearch(post, query){
  const tagsText = Array.isArray(post.tags) ? post.tags.join(' ') : (post.tags || '');
  return wordStartsWith(post.title, query) ||
    wordStartsWith(post.snippet, query) ||
    wordStartsWith(post.category, query) ||
    wordStartsWith(tagsText, query);
}
function renderSearchResults(){
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  const box = document.getElementById('searchResults');
  if(!query){
    box.innerHTML = `<div class="empty-state">Search for articles, teams, or players</div>`;
    return;
  }
  const results = posts.filter(p=> matchesSearch(p, query));
  if(!results.length){
    box.innerHTML = `<div class="empty-state">No articles found for &quot;${escapeHtml(query)}&quot;</div>`;
    return;
  }
  box.innerHTML = results.map(p=>cardHtml(p)).join('');
  attachCardHandlers(box);
}
document.getElementById('searchInput').addEventListener('input', renderSearchResults);
