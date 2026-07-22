/* =========================================================
   VIEW SWITCHING
   ========================================================= */
function hideAllViews(){
  document.getElementById('feedView').hidden = true;
  document.getElementById('articleView').hidden = true;
  document.getElementById('writerView').hidden = true;
  document.getElementById('dashboardView').hidden = true;
  document.getElementById('searchView').hidden = true;
}
function showFeed(){ hideAllViews(); document.getElementById('feedView').hidden = false; }
function showArticle(){ hideAllViews(); document.getElementById('articleView').hidden = false; window.scrollTo(0,0); }
function showWriter(){ hideAllViews(); document.getElementById('writerView').hidden = false; window.scrollTo(0,0); }
function showDashboard(){ hideAllViews(); document.getElementById('dashboardView').hidden = false; window.scrollTo(0,0); renderDashboard(); }
function showSearch(){
  hideAllViews();
  document.getElementById('searchView').hidden = false;
  window.scrollTo(0,0);
  renderSearchResults();
  document.getElementById('searchInput').focus();
}

document.getElementById('backToFeed').addEventListener('click', ()=>{ showFeed(); stopReadStatusTimer(); stopCommentsListener(); });
document.getElementById('openWriter').addEventListener('click', ()=>{ resetWriterForm(); showWriter(); });
document.getElementById('sidebarWrite').addEventListener('click', ()=>{ closeSidebar(); resetWriterForm(); showWriter(); });
document.getElementById('backFromWriter').addEventListener('click', showFeed);
document.getElementById('cancelWriter').addEventListener('click', showFeed);
document.getElementById('openDashboard').addEventListener('click', showDashboard);
document.getElementById('backFromDashboard').addEventListener('click', showFeed);
document.getElementById('backFromSearch').addEventListener('click', showFeed);

// Search bar on the Home tab opens the real search view.
document.getElementById('searchBarStub').addEventListener('click', showSearch);
