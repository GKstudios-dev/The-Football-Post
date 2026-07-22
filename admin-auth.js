/* =========================================================
   ADMIN GATE — regular readers never see "Admin," "+ New Post,"
   or delete controls. To reach admin mode, open the site with
   #admin on the end of the URL, e.g.:
     https://your-site-url/#admin
   Bookmark that for yourself. Once signed in there, Firebase keeps
   you signed in, so admin controls reappear on later visits too —
   even without the #admin link. This is a separate concern from
   reader sign-in (reader-auth.js): the same Firebase Auth is used
   under the hood, but only your admin email unlocks these controls.
   In local-only mode (no Firebase configured) there's no real
   security either way, so the controls just stay visible.
   ========================================================= */
const openWriterBtn = document.getElementById('openWriter');
const sidebarWriteBtn = document.getElementById('sidebarWrite');
const openDashboardBtn = document.getElementById('openDashboard');
const adminBtn = document.getElementById('adminBtn');
const adminPanel = document.getElementById('adminPanel');

function isAdminUrl(){
  return location.hash.replace('#','').split('&').includes('admin');
}
function setWriteControlsVisible(visible){
  openWriterBtn.hidden = !visible;
  sidebarWriteBtn.hidden = !visible;
  openDashboardBtn.hidden = !visible;
}
function setAdminOnlyUiVisible(visible){
  adminBtn.hidden = !visible;
  document.getElementById('modeBadge').hidden = !visible;
  document.getElementById('footerAdminNote').hidden = !visible;
}

if(FIREBASE_READY){
  setWriteControlsVisible(false);
  setAdminOnlyUiVisible(isAdminUrl());
  try{
    firebase.auth().onAuthStateChanged(user=>{
      const admin = !!(user && user.email === CONFIG.adminEmail);
      setWriteControlsVisible(admin);
      setAdminOnlyUiVisible(admin || isAdminUrl());
      adminBtn.textContent = admin ? 'Sign out (admin)' : 'Admin';
      // Reader-facing sign-in UI (sidebar item, comment box, like gating)
      // reacts to the same auth state — handled in reader-auth.js.
      if(typeof onReaderAuthStateChanged === 'function') onReaderAuthStateChanged(user);
    });
  }catch(e){
    console.warn('Firebase Auth failed to start — admin login disabled, articles will still load:', e);
  }
} else {
  setWriteControlsVisible(true);
  setAdminOnlyUiVisible(false);
}

adminBtn.addEventListener('click', ()=>{
  if(!FIREBASE_READY) return;
  const user = firebase.auth().currentUser;
  if(user && user.email === CONFIG.adminEmail){
    firebase.auth().signOut();
    return;
  }
  document.getElementById('adminError').textContent = '';
  adminPanel.hidden = false;
});
document.getElementById('adminCancel').addEventListener('click', ()=> adminPanel.hidden = true);
document.getElementById('adminSubmit').addEventListener('click', ()=>{
  const email = document.getElementById('admin_email').value.trim();
  const pass = document.getElementById('admin_pass').value;
  const errBox = document.getElementById('adminError');
  errBox.textContent = '';
  firebase.auth().signInWithEmailAndPassword(email, pass)
    .then(()=>{
      adminPanel.hidden = true;
      document.getElementById('admin_pass').value = '';
    })
    .catch(()=>{ errBox.textContent = 'Sign-in failed — check the email and password.'; });
});
