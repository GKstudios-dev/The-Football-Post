/* =========================================================
   LIKES — stored on the post document itself as `likes` (a count)
   and `likedBy` (an array of the signer's uids), per the Firestore
   rules. One like per account, and you must be signed in to like
   or unlike anything. This fully replaces the old anonymous,
   localStorage-only like system.
   ========================================================= */
function isLikedByCurrentUser(post){
  const user = currentReader();
  if(!user) return false;
  const likedBy = post.likedBy || [];
  return likedBy.includes(user.uid);
}

function toggleLike(post){
  const user = currentReader();
  if(!user){
    openReaderAuthModal();
    return;
  }
  if(!FIREBASE_READY){
    alert('Likes need the shared database to be configured.');
    return;
  }
  const alreadyLiked = isLikedByCurrentUser(post);
  const ref = db.collection('posts').doc(post.id);
  const update = alreadyLiked
    ? {
        likes: firebase.firestore.FieldValue.increment(-1),
        likedBy: firebase.firestore.FieldValue.arrayRemove(user.uid)
      }
    : {
        likes: firebase.firestore.FieldValue.increment(1),
        likedBy: firebase.firestore.FieldValue.arrayUnion(user.uid)
      };
  ref.update(update).catch(err=>{
    console.warn('Could not update like:', err);
    alert('Could not update your like — try again.');
  });
  // No manual DOM patching needed — the posts onSnapshot listener in
  // data-store.js will pick up the change and refresh the UI.
}
