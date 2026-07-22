/* =========================================================
   POSTS DATA STORE
   - Firebase configured: posts live in Firestore, synced live to
     every visitor via onSnapshot.
   - Not configured: posts save to this browser's local storage only.
   ========================================================= */
function loadLocalPosts(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      if(Array.isArray(parsed) && parsed.length) return parsed;
    }
  }catch(e){ /* storage unavailable or corrupted — fall back to sample posts */ }
  return null;
}
function saveLocalPosts(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(posts)); }
  catch(e){ console.warn('Could not save posts to this browser:', e); }
}

let posts = FIREBASE_READY ? [] : (loadLocalPosts() || SAMPLE_POSTS.slice());
let firebaseHasLoaded = false;

function startPostsFeed(){
  if(!FIREBASE_READY) return;
  db.collection('posts').orderBy('date','desc').onSnapshot(
    snapshot=>{
      firebaseHasLoaded = true;
      posts = snapshot.empty ? [] : snapshot.docs.map(d=>({ id:d.id, ...d.data() }));
      buildTicker();
      renderFeed();
      // If the article view is open, refresh its live bits (read status,
      // like button, comment count) instead of tearing the whole view down.
      if(!document.getElementById('articleView').hidden && currentOpenArticleId){
        refreshArticleLiveBits(currentOpenArticleId);
      }
    },
    err=>{
      console.warn('Could not reach the shared database, using this browser\'s local posts instead:', err);
      posts = loadLocalPosts() || SAMPLE_POSTS.slice();
      buildTicker();
      renderFeed();
    }
  );
}

function addPost(newPost){
  if(FIREBASE_READY){
    db.collection('posts').add(newPost).catch(err=>alert('Could not publish — check your Firebase setup.\n\n'+err.message));
  } else {
    posts.unshift({ id: 'p' + Date.now(), ...newPost });
    saveLocalPosts();
    buildTicker();
    renderFeed();
  }
}

function updatePost(id, updatedFields){
  if(FIREBASE_READY){
    db.collection('posts').doc(id).update(updatedFields).catch(err=>alert('Could not save changes — check your Firebase setup.\n\n'+err.message));
  } else {
    const idx = posts.findIndex(p=>p.id===id);
    if(idx > -1) posts[idx] = { ...posts[idx], ...updatedFields };
    saveLocalPosts();
    buildTicker();
    renderFeed();
  }
}

function deletePost(id){
  if(!confirm('Delete this post? This cannot be undone.')) return;
  if(FIREBASE_READY){
    db.collection('posts').doc(id).delete().catch(err=>alert('Could not delete: '+err.message));
  } else {
    posts = posts.filter(p=>p.id!==id);
    saveLocalPosts();
    buildTicker();
    renderFeed();
  }
  showFeed();
}
