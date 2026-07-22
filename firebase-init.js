/* =========================================================
   FIREBASE SETUP
   Paste your project's config here (Project settings → Your apps →
   the </> web app → the config object). If you leave the placeholder
   values, the site still runs, but in local-only mode: posts save to
   this browser only, and sign-in/likes/comments won't work since
   those need a real backend.
   ========================================================= */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC3voAMmdRAKjQNqPodo48bhpS-Hbk665U",
  authDomain: "footy-inform.firebaseapp.com",
  projectId: "footy-inform",
  storageBucket: "footy-inform.firebasestorage.app",
  messagingSenderId: "1012360360408",
  appId: "1:1012360360408:web:05c6fce72031ea870782ad"
};

const FIREBASE_READY = !!(FIREBASE_CONFIG.apiKey && !FIREBASE_CONFIG.apiKey.startsWith('PASTE_'));
let db = null;

if(FIREBASE_READY){
  try{
    firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.firestore();
  }catch(e){
    console.warn('Firebase failed to start, falling back to local-only mode:', e);
  }
}

function isAdmin(){
  if(!FIREBASE_READY) return true; // local-only mode: no accounts to gate behind
  try{
    const user = firebase.auth().currentUser;
    return !!(user && user.email === CONFIG.adminEmail);
  }catch(e){
    return false;
  }
}

// Any signed-in user who ISN'T the admin — i.e. a regular reader who can
// like and comment.
function currentReader(){
  if(!FIREBASE_READY) return null;
  try{
    return firebase.auth().currentUser || null;
  }catch(e){
    return null;
  }
}

function readerDisplayName(user){
  if(!user) return 'Reader';
  return user.displayName || (user.email ? user.email.split('@')[0] : 'Reader');
}
