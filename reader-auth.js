/* =========================================================
   READER SIGN-IN — separate from the admin panel. Any visitor can
   create an account with an email, password, and display name; that
   account is what lets them like articles and post comments. Uses
   the same Firebase Auth project as the admin login — a reader is
   simply any signed-in user whose email isn't the admin email.
   ========================================================= */
const readerAuthOverlay = document.getElementById('readerAuthOverlay');
const readerAuthModal = document.getElementById('readerAuthModal');

function openReaderAuthModal(){
  if(!FIREBASE_READY){
    alert('Sign-in needs the shared database to be configured first.');
    return;
  }
  document.getElementById('readerSigninError').textContent = '';
  document.getElementById('readerSignupError').textContent = '';
  switchAuthTab('signin');
  readerAuthOverlay.hidden = false;
  readerAuthModal.hidden = false;
}
function closeReaderAuthModal(){
  readerAuthOverlay.hidden = true;
  readerAuthModal.hidden = true;
}
document.getElementById('readerAuthClose').addEventListener('click', closeReaderAuthModal);
readerAuthOverlay.addEventListener('click', closeReaderAuthModal);

function switchAuthTab(which){
  const signinTab = document.getElementById('authTabSignin');
  const signupTab = document.getElementById('authTabSignup');
  signinTab.classList.toggle('active', which==='signin');
  signupTab.classList.toggle('active', which==='signup');
  document.getElementById('authSigninPane').hidden = which !== 'signin';
  document.getElementById('authSignupPane').hidden = which !== 'signup';
}
document.getElementById('authTabSignin').addEventListener('click', ()=> switchAuthTab('signin'));
document.getElementById('authTabSignup').addEventListener('click', ()=> switchAuthTab('signup'));

document.getElementById('readerSigninSubmit').addEventListener('click', ()=>{
  const email = document.getElementById('reader_signin_email').value.trim();
  const pass = document.getElementById('reader_signin_pass').value;
  const errBox = document.getElementById('readerSigninError');
  errBox.textContent = '';
  if(!email || !pass){ errBox.textContent = 'Enter your email and password.'; return; }
  firebase.auth().signInWithEmailAndPassword(email, pass)
    .then(()=>{
      closeReaderAuthModal();
      document.getElementById('reader_signin_pass').value = '';
    })
    .catch(err=>{ errBox.textContent = readableAuthError(err); });
});

document.getElementById('readerSignupSubmit').addEventListener('click', ()=>{
  const name = document.getElementById('reader_signup_name').value.trim();
  const email = document.getElementById('reader_signup_email').value.trim();
  const pass = document.getElementById('reader_signup_pass').value;
  const errBox = document.getElementById('readerSignupError');
  errBox.textContent = '';
  if(!name){ errBox.textContent = 'Pick a display name for your comments.'; return; }
  if(!email || !pass){ errBox.textContent = 'Enter an email and password.'; return; }
  if(pass.length < 6){ errBox.textContent = 'Password needs to be at least 6 characters.'; return; }
  firebase.auth().createUserWithEmailAndPassword(email, pass)
    .then(cred=> cred.user.updateProfile({ displayName: name }))
    .then(()=>{
      closeReaderAuthModal();
      document.getElementById('reader_signup_pass').value = '';
    })
    .catch(err=>{ errBox.textContent = readableAuthError(err); });
});

function readableAuthError(err){
  switch(err.code){
    case 'auth/email-already-in-use': return 'That email already has an account — try signing in instead.';
    case 'auth/invalid-email': return 'That email address doesn\'t look right.';
    case 'auth/weak-password': return 'Password needs to be at least 6 characters.';
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-credential': return 'Email or password is incorrect.';
    default: return err.message || 'Something went wrong — try again.';
  }
}

/* =========================================================
   SIDEBAR ACCOUNT ROW — mirrors the app drawer: shows the signed-in
   reader's email with a sign-out option, or a "Sign In" prompt.
   Called from admin-auth.js's onAuthStateChanged so there's a single
   source of truth for auth state.
   ========================================================= */
function onReaderAuthStateChanged(user){
  const item = document.getElementById('sidebarAuthItem');
  const text = document.getElementById('sidebarAuthText');
  const subtitle = document.getElementById('sidebarAuthSubtitle');
  if(!item) return;

  if(user){
    text.textContent = user.email || 'Signed in';
    subtitle.textContent = 'Tap to sign out';
    subtitle.hidden = false;
  } else {
    text.textContent = 'Sign In';
    subtitle.textContent = 'To like and comment on articles';
    subtitle.hidden = false;
  }

  // Keep any open article's like/comment UI in sync with the new auth state.
  if(typeof refreshArticleLiveBits === 'function' && currentOpenArticleId){
    refreshArticleLiveBits(currentOpenArticleId);
  }
  if(typeof refreshCommentComposer === 'function') refreshCommentComposer();
}

document.getElementById('sidebarAuthItem').addEventListener('click', ()=>{
  closeSidebar();
  const user = FIREBASE_READY ? firebase.auth().currentUser : null;
  if(user){
    if(confirm('Sign out of your account?')) firebase.auth().signOut();
  } else {
    openReaderAuthModal();
  }
});
