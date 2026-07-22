/* =========================================================
   FOOTER / BRAND FROM CONFIG
   ========================================================= */
document.getElementById('brandMark').innerHTML = CONFIG.siteName.replace(/(\S+)$/, '<em>$1</em>');
document.getElementById('footerYear').textContent = CONFIG.autoYear ? new Date().getFullYear() : CONFIG.copyrightYear;
document.getElementById('footerSiteName').textContent = CONFIG.siteName;

document.getElementById('resetContent').addEventListener('click', ()=>{
  if(FIREBASE_READY){
    alert('You\'re in shared (live) mode — posts live in Firestore now. Delete individual posts by opening them and using "Delete this post", or manage them from the Firebase console.');
    return;
  }
  if(!confirm('This clears everything you\'ve published in this browser and brings back the 6 sample posts. Continue?')) return;
  posts = SAMPLE_POSTS.slice();
  saveLocalPosts();
  buildTicker();
  renderFeed();
  showFeed();
});

document.getElementById('modeBadge').textContent = FIREBASE_READY ? '● Shared, live' : '● Local only';
document.getElementById('modeBadge').style.color = FIREBASE_READY ? 'var(--good)' : 'var(--chalk-dim)';

/* =========================================================
   INIT
   Each call is isolated so a failure in one can never prevent
   startPostsFeed() from running — that's the call that actually
   fetches articles.
   ========================================================= */
try{ buildTicker(); }catch(e){ console.error('buildTicker failed:', e); }
try{ renderFeed(); }catch(e){ console.error('renderFeed failed:', e); }
try{ runSeoCheck(); }catch(e){ console.error('runSeoCheck failed:', e); }
try{ onReaderAuthStateChanged(FIREBASE_READY ? firebase.auth().currentUser : null); }catch(e){ console.error('reader auth init failed:', e); }
startPostsFeed();
