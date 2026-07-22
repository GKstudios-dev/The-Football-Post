/* =========================================================
   DRAWER (SIDEBAR)
   ========================================================= */
let state = { category: "all", sort: "home" };

const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const hamburger = document.getElementById('hamburger');

function openSidebar(){
  sidebar.classList.add('open');
  overlay.classList.add('show');
  hamburger.classList.add('active');
  hamburger.setAttribute('aria-expanded','true');
}
function closeSidebar(){
  sidebar.classList.remove('open');
  overlay.classList.remove('show');
  hamburger.classList.remove('active');
  hamburger.setAttribute('aria-expanded','false');
}
hamburger.addEventListener('click', ()=> sidebar.classList.contains('open') ? closeSidebar() : openSidebar());
overlay.addEventListener('click', closeSidebar);
document.getElementById('sidebarClose').addEventListener('click', closeSidebar);

function setCategory(cat){
  state.category = cat;
  document.querySelectorAll('.nav-item[data-cat]').forEach(n=>n.classList.toggle('active', n.dataset.cat===cat));
  document.querySelectorAll('.chip[data-cat]').forEach(n=>n.classList.toggle('active', n.dataset.cat===cat));
  showFeed();
  renderFeed();
}

document.querySelectorAll('.nav-item[data-cat]').forEach(el=>{
  el.addEventListener('click', (e)=>{
    e.preventDefault();
    closeSidebar();
    setCategory(el.dataset.cat);
  });
});
document.querySelector('.nav-item[data-cat="all"]').classList.add('active');

// Category chips on the Home tab — same destinations as the sidebar links,
// just a faster path (mirrors the app's chip row under the tab bar).
document.querySelectorAll('.chip[data-cat]').forEach(el=>{
  el.addEventListener('click', ()=> setCategory(el.dataset.cat));
});

/* Policy links — same URLs as the Flutter app's drawer. */
document.getElementById('navPrivacy').href = POLICY_LINKS.privacyPolicy;
document.getElementById('navTerms').href = POLICY_LINKS.termsOfUse;
document.getElementById('navAbout').href = POLICY_LINKS.aboutUs;
document.getElementById('navContact').href = POLICY_LINKS.contactUs;
document.getElementById('navSupport').href = POLICY_LINKS.support;

/* Home / Trending tabs — mirrors the app's two-tab TabBar. */
const tabHome = document.getElementById('tabHome');
const tabTrendingOnly = document.getElementById('tabTrendingOnly');

function activateTab(btn){
  [tabHome,tabTrendingOnly].forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
}
tabHome.addEventListener('click', ()=>{ state.sort='home'; activateTab(tabHome); renderFeed(); });
tabTrendingOnly.addEventListener('click', ()=>{ state.sort='trendingOnly'; activateTab(tabTrendingOnly); renderFeed(); });
