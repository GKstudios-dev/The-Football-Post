/* =========================================================
   INSTALLABLE APP (PWA)
   Needs manifest.json and sw.js sitting next to index.html in the
   same repo. Chrome/Edge/Android show the "Install App" button
   automatically once those are in place; Safari on iPhone/iPad
   doesn't support this prompt — iOS visitors add it via
   Share → "Add to Home Screen" manually.
   ========================================================= */
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').catch(err=> console.warn('Service worker failed to register:', err));
  });
}
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  deferredInstallPrompt = e;
  document.getElementById('installBtn').hidden = false;
});
document.getElementById('installBtn').addEventListener('click', async ()=>{
  if(!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  document.getElementById('installBtn').hidden = true;
});
window.addEventListener('appinstalled', ()=>{ document.getElementById('installBtn').hidden = true; });
