const $ = id => document.getElementById(id);
let state = { tabs: [], activeId: null };
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function render(data) {
  state = data;
  $('tabs').innerHTML = data.tabs.map(tab => `
    <div class="tab ${tab.id === data.activeId ? 'active' : ''}" data-id="${tab.id}">
      <span class="tab-dot"></span><span class="tab-title">${escapeHtml(tab.title)}</span>
      <button class="tab-close" data-close="${tab.id}" title="Закрыть">×</button>
    </div>`).join('');
  const active = data.tabs.find(t => t.id === data.activeId);
  if (active) {
    if (document.activeElement !== $('address')) $('address').value = active.url || '';
    $('back').disabled = !active.canGoBack;
    $('forward').disabled = !active.canGoForward;
    $('reload').textContent = active.loading ? '…' : '↻';
  }
}
$('tabs').addEventListener('click', e => {
  const close = e.target.closest('[data-close]');
  if (close) { e.stopPropagation(); window.liqra.closeTab(Number(close.dataset.close)); return; }
  const tab = e.target.closest('[data-id]');
  if (tab) window.liqra.activateTab(Number(tab.dataset.id));
});
$('newTab').addEventListener('click', () => window.liqra.newTab());
$('addressForm').addEventListener('submit', e => { e.preventDefault(); window.liqra.navigate($('address').value); $('address').blur(); });
$('back').addEventListener('click', () => window.liqra.back());
$('forward').addEventListener('click', () => window.liqra.forward());
$('reload').addEventListener('click', () => window.liqra.reload());
$('home').addEventListener('click', () => window.liqra.home());
$('theme').addEventListener('click', () => {
  const dark = document.body.classList.toggle('light');
  localStorage.setItem('liqra-theme', dark ? 'light' : 'dark');
});
if (localStorage.getItem('liqra-theme') === 'light') document.body.classList.add('light');
window.liqra.onTabs(render);
window.liqra.onError(message => { $('toast').textContent = message; $('toast').classList.add('show'); setTimeout(() => $('toast').classList.remove('show'), 3000); });
window.liqra.state().then(render);
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') { e.preventDefault(); $('address').focus(); $('address').select(); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') { e.preventDefault(); window.liqra.newTab(); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') { e.preventDefault(); if (state.activeId) window.liqra.closeTab(state.activeId); }
  if (e.key === 'F5') { e.preventDefault(); window.liqra.reload(); }
});