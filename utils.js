/* =========================================================
   SHARED HELPERS — used by feed.js, article.js, comments.js, etc.
   ========================================================= */

// Firestore can hand back dates as Timestamp objects (with .toDate()),
// plain {seconds,nanoseconds} objects, ISO strings, or date-only strings.
// This normalizes any of those into a real JS Date.
function toJSDate(value){
  if(value === null || value === undefined) return new Date(NaN);
  if(value instanceof Date) return value;
  if(typeof value === 'string'){
    return value.includes('T') ? new Date(value) : new Date(value+'T00:00:00');
  }
  if(typeof value.toDate === 'function') return value.toDate(); // Firestore Timestamp
  if(typeof value.seconds === 'number') return new Date(value.seconds*1000); // plain {seconds,nanoseconds}
  return new Date(value);
}

function fmtDate(iso){
  const d = toJSDate(iso);
  if(isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
}

function timeAgo(iso){
  const d = toJSDate(iso);
  if(isNaN(d.getTime())) return 'Just now';
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if(seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if(minutes < 60) return `${minutes} minute${minutes===1?'':'s'} ago`;
  const hours = Math.floor(minutes / 60);
  if(hours < 24) return `${hours} hour${hours===1?'':'s'} ago`;
  const days = Math.floor(hours / 24);
  if(days < 7) return `${days} day${days===1?'':'s'} ago`;
  const weeks = Math.floor(days / 7);
  if(days < 30) return `${weeks} week${weeks===1?'':'s'} ago`;
  const months = Math.floor(days / 30);
  if(days < 365) return `${months} month${months===1?'':'s'} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years===1?'':'s'} ago`;
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

function wordCount(str){ return str.trim().split(/\s+/).filter(Boolean).length; }
