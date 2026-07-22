/* =========================================================
   FEED RENDERING
   ========================================================= */
let carouselTimer = null;
function stopCarousel(){
  if(carouselTimer){ clearInterval(carouselTimer); carouselTimer = null; }
}

function cardHtml(p){
  const readBadge = p.readAt ? `<div class="read-badge">Read ${timeAgo(p.readAt)}</div>` : '<span></span>';
  const isLiked = isLikedByCurrentUser(p);
  const likeCount = p.likes || 0;
  return `
    <a class="card-h" href="#" data-id="${p.id}">
      <img class="card-h-img" src="${p.image}" alt="${escapeHtml(p.imageAlt||'')}" loading="lazy">
      <div class="card-h-body">
        <div class="card-h-meta">
          <span class="tag ${p.category}">${CATEGORY_LABELS[p.category]}</span>
          <span class="dot">&middot;</span>
          <span>${fmtDate(p.date)}</span>
        </div>
        <h3>${escapeHtml(p.title)}</h3>
        <p class="snippet-h">${escapeHtml(p.snippet)}</p>
        <div class="card-h-foot">
          ${readBadge}
          <button type="button" class="card-h-like ${isLiked?'liked':''}" data-id="${p.id}" aria-label="${isLiked?'Unlike':'Like'} this post">
            <span class="heart">${isLiked?'♥':'♡'}</span><span class="like-num">${likeCount}</span>
          </button>
        </div>
      </div>
    </a>`;
}

function attachCardHandlers(container){
  container.querySelectorAll('.card-h').forEach(card=>{
    card.addEventListener('click', (e)=>{
      if(e.target.closest('.card-h-like')) return; // like button handles its own click
      e.preventDefault();
      openArticle(card.dataset.id);
    });
  });
  container.querySelectorAll('.card-h-like').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      e.stopPropagation();
      const post = posts.find(p=>p.id===btn.dataset.id);
      if(post) toggleLike(post);
    });
  });
}

function buildCarouselHtml(list){
  if(!list.length) return '';
  return `
    <div class="trending-carousel">
      <div class="trending-track">
        ${list.map((p,i)=>`
          <a href="#" class="trending-slide ${i===0?'active':''}" data-id="${p.id}" style="background-image:url('${p.image}')">
            <div class="trending-slide-overlay">
              <span class="badge">TRENDING</span>
              <h3>${escapeHtml(p.title)}</h3>
            </div>
          </a>`).join('')}
      </div>
      ${list.length>1 ? `<div class="trending-dots">
        ${list.map((_,i)=>`<span class="trending-dot ${i===0?'active':''}"></span>`).join('')}
      </div>` : ''}
    </div>`;
}

function startCarousel(count){
  if(count<=1) return;
  let idx = 0;
  carouselTimer = setInterval(()=>{
    const slides = document.querySelectorAll('.trending-slide');
    const dots = document.querySelectorAll('.trending-dot');
    if(!slides.length){ stopCarousel(); return; }
    slides[idx].classList.remove('active');
    dots[idx]?.classList.remove('active');
    idx = (idx+1) % slides.length;
    slides[idx].classList.add('active');
    dots[idx]?.classList.add('active');
  }, 5000);
}

// Reader-facing empty state. While Firestore hasn't sent its first
// snapshot yet, this is "loading", not "empty".
function feedEmptyMessage(fallback){
  if(FIREBASE_READY && !firebaseHasLoaded) return 'Loading articles…';
  if(isAdmin()) return 'No posts in this category yet. Use "+ New Post" to add the first one.';
  return fallback;
}

function renderFeed(){
  const feed = document.getElementById('feed');
  const note = document.getElementById('filterNote');
  stopCarousel();
  let list = posts.slice();

  if(state.category !== 'all'){
    list = list.filter(p=>p.category===state.category);
    note.hidden = false;
    note.innerHTML = `Showing <b style="color:var(--chalk)">${CATEGORY_LABELS[state.category]}</b> only &middot; <button id="clearFilter">show all</button>`;
    document.getElementById('clearFilter').addEventListener('click', ()=>{
      setCategory('all');
    });
  } else {
    note.hidden = true;
  }

  if(state.sort === 'home'){
    const trendList = posts.filter(p=>p.trending).sort((a,b)=> toJSDate(b.date)-toJSDate(a.date));
    list.sort((a,b)=> (b.trending - a.trending) || (toJSDate(b.date)-toJSDate(a.date)));

    let html = buildCarouselHtml(trendList);
    if(list.length){
      html += `<div class="section-label">Latest Stories</div>`;
      html += list.map(p=>cardHtml(p)).join('');
    } else if(!trendList.length){
      html += `<div class="empty-state">${feedEmptyMessage('No articles yet — check back soon.')}</div>`;
    }
    feed.innerHTML = html;
    attachCardHandlers(feed);
    feed.querySelectorAll('.trending-slide').forEach(slide=>{
      slide.addEventListener('click', (e)=>{
        e.preventDefault();
        openArticle(slide.dataset.id);
      });
    });
    if(trendList.length) startCarousel(trendList.length);
    return;
  }

  // state.sort === 'trendingOnly' — only posts marked "trending", newest first.
  list = list.filter(p=>p.trending);
  list.sort((a,b)=> toJSDate(b.date)-toJSDate(a.date));

  if(list.length === 0){
    feed.innerHTML = `<div class="empty-state">${feedEmptyMessage('No trending articles yet.')}</div>`;
    return;
  }

  feed.innerHTML = list.map(p=>cardHtml(p)).join('');
  attachCardHandlers(feed);
}

/* Related posts for the bottom of an article: same category first
   (most recent), topped up with other recent posts if needed. */
function relatedPostsFor(p, limit = 8){
  const sameCategory = posts
    .filter(x => x.id !== p.id && x.category === p.category)
    .sort((a,b)=> toJSDate(b.date) - toJSDate(a.date));
  const picked = sameCategory.slice(0, limit);
  if(picked.length < limit){
    const usedIds = new Set([p.id, ...picked.map(x=>x.id)]);
    const filler = posts
      .filter(x => !usedIds.has(x.id))
      .sort((a,b)=> toJSDate(b.date) - toJSDate(a.date))
      .slice(0, limit - picked.length);
    picked.push(...filler);
  }
  return picked;
}

function relatedCardHtml(p){
  return `
    <a class="related-card" href="#" data-id="${p.id}">
      <img src="${p.image}" alt="${escapeHtml(p.imageAlt||'')}" loading="lazy">
      <span class="tag ${p.category}">${CATEGORY_LABELS[p.category]}</span>
      <h4>${escapeHtml(p.title)}</h4>
    </a>`;
}

function attachRelatedCardHandlers(container){
  container.querySelectorAll('.related-card').forEach(card=>{
    card.addEventListener('click', (e)=>{
      e.preventDefault();
      openArticle(card.dataset.id);
    });
  });
}

/* =========================================================
   TICKER
   ========================================================= */
function buildTicker(){
  const items = posts.slice(0,6).map(p=>`<span><b>${CATEGORY_LABELS[p.category].toUpperCase()}</b> — ${escapeHtml(p.title)}</span>`).join('');
  document.getElementById('tickerTrack').innerHTML = items + items; // duplicate for seamless loop
}
