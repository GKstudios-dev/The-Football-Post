/* =========================================================
   COMMENTS — one Firestore subcollection per post: posts/{id}/comments.
   Anyone can read comments; only a signed-in reader can post one, and
   only as themselves. Posting a comment also bumps the parent post's
   commentCount by 1 in the same batch write.
   ========================================================= */
let unsubscribeComments = null;
let currentCommentsPostId = null;

function stopCommentsListener(){
  if(unsubscribeComments){ unsubscribeComments(); unsubscribeComments = null; }
  currentCommentsPostId = null;
}

function startCommentsListener(postId){
  stopCommentsListener();
  if(!FIREBASE_READY) return;
  currentCommentsPostId = postId;
  unsubscribeComments = db.collection('posts').doc(postId).collection('comments')
    .orderBy('createdAt', 'asc')
    .onSnapshot(
      snapshot=>{
        const comments = snapshot.docs.map(d=>({ id:d.id, ...d.data() }));
        renderCommentsList(comments);
      },
      err=> console.warn('Could not load comments:', err)
    );
}

function renderCommentsList(comments){
  const list = document.getElementById('commentsList');
  if(!list) return;
  if(!comments.length){
    list.innerHTML = `<div class="empty-state">No comments yet — be the first to say something.</div>`;
    return;
  }
  const user = currentReader();
  list.innerHTML = comments.map(c=>{
    const canDelete = user && (c.userId === user.uid || isAdmin());
    return `
      <div class="comment-item" data-id="${c.id}">
        <div class="comment-head">
          <b>${escapeHtml(c.displayName || 'Reader')}</b>
          <span class="comment-time">${c.createdAt ? timeAgo(c.createdAt) : 'Just now'}</span>
        </div>
        <div class="comment-text">${escapeHtml(c.text)}</div>
        ${canDelete ? `<button type="button" class="comment-delete" data-id="${c.id}">Delete</button>` : ''}
      </div>`;
  }).join('');

  list.querySelectorAll('.comment-delete').forEach(btn=>{
    btn.addEventListener('click', ()=> deleteComment(currentCommentsPostId, btn.dataset.id));
  });
}

function deleteComment(postId, commentId){
  if(!confirm('Delete this comment?')) return;
  db.collection('posts').doc(postId).collection('comments').doc(commentId).delete()
    .catch(err=> alert('Could not delete comment: ' + err.message));
}

function submitComment(postId, text){
  const user = currentReader();
  if(!user){ openReaderAuthModal(); return; }
  const trimmed = text.trim();
  if(!trimmed) return;
  if(!FIREBASE_READY){ alert('Comments need the shared database to be configured.'); return; }

  const postRef = db.collection('posts').doc(postId);
  const commentRef = postRef.collection('comments').doc();
  const batch = db.batch();
  batch.set(commentRef, {
    userId: user.uid,
    userEmail: user.email || 'Anonymous',
    displayName: readerDisplayName(user),
    text: trimmed,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  batch.update(postRef, { commentCount: firebase.firestore.FieldValue.increment(1) });
  batch.commit().catch(err=> alert('Could not post your comment: ' + err.message));
}

/* Composer swaps between "write a comment" and "sign in to comment"
   depending on auth state — called on article open and on auth change. */
function refreshCommentComposer(){
  const composer = document.getElementById('commentComposer');
  const prompt = document.getElementById('commentSignInPrompt');
  if(!composer || !prompt) return;
  const user = currentReader();
  composer.hidden = !user;
  prompt.hidden = !!user;
}

function wireCommentComposer(postId){
  const input = document.getElementById('commentInput');
  const submitBtn = document.getElementById('commentSubmitBtn');
  const promptBtn = document.getElementById('promptSignInBtn');
  if(input) input.value = '';
  if(submitBtn){
    submitBtn.onclick = ()=>{
      submitComment(postId, input.value);
      input.value = '';
    };
  }
  if(promptBtn) promptBtn.onclick = openReaderAuthModal;
  refreshCommentComposer();
}
