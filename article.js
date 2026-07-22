/* =========================================================
   ARTICLE VIEW
   ========================================================= */
let currentOpenArticleId = null;
let readStatusTimer = null;

// Body can be either a legacy array (## heading / paragraph strings from
// the original sample posts) or a plain HTML string (from the rich editor).
function bodyToHtml(body){
  if(!body) return '';
  if(Array.isArray(body)){
    return body.map(block=> block.startsWith('## ') ? `<h2>${escapeHtml(block.slice(3))}</h2>` : `<p>${escapeHtml(block)}</p>`).join('');
  }
  return body;
}

function recordRead(post){
  if(FIREBASE_READY){
    // The security rule requires readAt to be an actual Firestore
    // Timestamp (`is timestamp`) — a plain ISO string would fail that
    // check and get silently rejected for any non-admin visitor.
    post.readAt = new Date(); // reflect immediately in local state/UI
    db.collection('posts').doc(post.id).update({ readAt: firebase.firestore.FieldValue.serverTimestamp() })
      .catch(err=> console.warn('Could not save read time:', err));
  } else {
    post.readAt = new Date().toISOString();
    saveLocalPosts();
  }
}

function refreshReadStatusUI(id){
  const p = posts.find(x=>x.id===id);
  if(!p) return;
  const statusEl = document.getElementById('readStatus');
  if(statusEl) statusEl.textContent = p.readAt ? `Read ${timeAgo(p.readAt)}` : 'Read just now';
}

function stopReadStatusTimer(){
  if(readStatusTimer){ clearInterval(readStatusTimer); readStatusTimer = null; }
}

/* Called whenever the posts snapshot refreshes (likes, comment counts,
   read times) while an article is open — updates just the live bits
   instead of tearing down and rebuilding the whole article view. */
function refreshArticleLiveBits(id){
  const p = posts.find(x=>x.id===id);
  if(!p) return;
  refreshReadStatusUI(id);

  const likeBtn = document.getElementById('likeBtn');
  if(likeBtn){
    const liked = isLikedByCurrentUser(p);
    likeBtn.classList.toggle('liked', liked);
    likeBtn.querySelector('.heart').textContent = liked ? '♥' : '♡';
    const countEl = document.getElementById('likeCount');
    if(countEl) countEl.textContent = p.likes || 0;
    const labelEl = document.getElementById('likeLabel');
    if(labelEl) labelEl.textContent = (p.likes||0)===1 ? 'Like' : 'Likes';
  }

  const commentCountLabel = document.getElementById('commentCountLabel');
  if(commentCountLabel) commentCountLabel.textContent = p.commentCount || 0;
}

function openArticle(id){
  const p = posts.find(x=>x.id===id);
  if(!p) return;
  const bodyHtml = bodyToHtml(p.body);
  const isLiked = isLikedByCurrentUser(p);
  const likeCount = p.likes || 0;
  const commentCount = p.commentCount || 0;
  const related = relatedPostsFor(p);

  currentOpenArticleId = id;
  recordRead(p);

  document.getElementById('articleContent').innerHTML = `
    <div class="article-meta">
      <span class="tag ${p.category}">${CATEGORY_LABELS[p.category]}</span>
    </div>
    <h1>${escapeHtml(p.title)}</h1>
    ${p.subtitle ? `<p class="article-subtitle">${escapeHtml(p.subtitle)}</p>` : ''}
    <img class="article-hero" src="${p.image}" alt="${escapeHtml(p.imageAlt||'')}">
    ${p.imageAlt ? `<div class="img-caption">${escapeHtml(p.imageAlt)}</div>` : ''}
    <div class="byline">By <b>${escapeHtml(p.author || 'Footy Post Staff')}</b> &middot; ${fmtDate(p.date)}</div>
    <div class="read-status" id="readStatus">Read just now</div>
    <div class="article-body">${bodyHtml}</div>
    <div class="like-row">
      <button class="like-btn ${isLiked ? 'liked' : ''}" id="likeBtn" data-id="${id}">
        <span class="heart">${isLiked ? '♥' : '♡'}</span>
        <span id="likeCount">${likeCount}</span> <span id="likeLabel">${likeCount===1?'Like':'Likes'}</span>
      </button>
    </div>
    ${isAdmin() ? `
      <button class="publish-btn" id="editPostBtn" style="margin-top:24px;">Edit this post</button>
      <button class="cancel-btn" id="deletePostBtn" style="margin-top:24px;margin-left:10px;">Delete this post</button>
    ` : ''}
    <div class="comments-section" id="commentsSection">
      <div class="section-label">Comments (<span id="commentCountLabel">${commentCount}</span>)</div>
      <div class="comment-composer" id="commentComposer" hidden>
        <textarea id="commentInput" class="comment-input" placeholder="Add a comment..." maxlength="1000"></textarea>
        <button class="publish-btn" id="commentSubmitBtn" style="margin-top:8px;">Post comment</button>
      </div>
      <div class="empty-state" id="commentSignInPrompt" hidden>
        Sign in to join the conversation.
        <div style="margin-top:10px;"><button class="publish-btn" id="promptSignInBtn">Sign In</button></div>
      </div>
      <div id="commentsList"></div>
    </div>
    ${related.length ? `
      <div class="related-section">
        <div class="section-label">Read Also</div>
        <div class="related-grid" id="relatedGrid">
          ${related.map(relatedCardHtml).join('')}
        </div>
      </div>
    ` : ''}
  `;
  const editBtn = document.getElementById('editPostBtn');
  if(editBtn) editBtn.addEventListener('click', ()=>{ loadPostIntoWriter(p); showWriter(); });
  const delBtn = document.getElementById('deletePostBtn');
  if(delBtn) delBtn.addEventListener('click', ()=> deletePost(p.id));
  const likeBtn = document.getElementById('likeBtn');
  if(likeBtn) likeBtn.addEventListener('click', ()=> toggleLike(p));
  const relatedGrid = document.getElementById('relatedGrid');
  if(relatedGrid) attachRelatedCardHandlers(relatedGrid);

  wireCommentComposer(id);
  startCommentsListener(id);

  stopReadStatusTimer();
  readStatusTimer = setInterval(()=> refreshReadStatusUI(id), 15000);

  // reflect the fresh "Read just now" on the homepage card too, next
  // time the feed is drawn (e.g. when the user hits Back)
  renderFeed();

  showArticle();
}

// "Read Also" links buried inside the article body (inserted via the
// writer's link picker) open that other post in-page instead of
// navigating anywhere.
document.getElementById('articleContent').addEventListener('click', (e)=>{
  const link = e.target.closest('a.inline-post-link');
  if(!link) return;
  e.preventDefault();
  const targetId = link.dataset.postId;
  if(targetId) openArticle(targetId);
});
