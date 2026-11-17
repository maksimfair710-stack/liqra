const { app, BrowserWindow, WebContentsView, ipcMain, shell } = require('electron');
const path = require('node:path');

let win;
let tabs = [];
let activeId = null;
let nextId = 1;
const TOOLBAR_HEIGHT = 118;

function send(channel, data) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, data);
}
function publicTab(tab) {
  return { id: tab.id, url: tab.url, title: tab.title || 'Новая вкладка', loading: tab.loading, canGoBack: tab.view.webContents.navigationHistory.canGoBack(), canGoForward: tab.view.webContents.navigationHistory.canGoForward() };
}
function publishTabs() { send('tabs:changed', { tabs: tabs.map(publicTab), activeId }); }
function layoutViews() {
  if (!win) return;
  const [width, height] = win.getContentSize();
  for (const tab of tabs) {
    if (tab.id === activeId) {
      tab.view.setBounds({ x: 0, y: TOOLBAR_HEIGHT, width, height: Math.max(0, height - TOOLBAR_HEIGHT) });
      tab.view.setVisible(true);
    } else tab.view.setVisible(false);
  }
}
function normalizeUrl(input) {
  const value = String(input || '').trim();
  if (!value) return 'https://www.google.com';
  if (/^(https?:\/\/|file:\/\/)/i.test(value)) return value;
  if (/^(localhost|127\.0\.0\.1)(:\d+)?([/?#].*)?$/i.test(value) || /^[\w.-]+\.[a-z]{2,}(:\d+)?([/?#].*)?$/i.test(value)) return 'https://' + value;
  return 'https://www.google.com/search?q=' + encodeURIComponent(value);
}
function createTab(url = 'https://www.google.com') {
  const id = nextId++;
  const view = new WebContentsView({ webPreferences: { partition: 'persist:liqra', sandbox: true } });
  const tab = { id, view, url, title: 'Загрузка…', loading: true };
  tabs.push(tab);
  view.webContents.setWindowOpenHandler(({ url }) => { createTab(url); return { action: 'deny' }; });
  view.webContents.on('page-title-updated', (e, title) => { tab.title = title; publishTabs(); });
  view.webContents.on('did-navigate', (e, url) => { tab.url = url; publishTabs(); });
  view.webContents.on('did-navigate-in-page', (e, url) => { tab.url = url; publishTabs(); });
  view.webContents.on('did-start-loading', () => { tab.loading = true; publishTabs(); });
  view.webContents.on('did-stop-loading', () => { tab.loading = false; publishTabs(); });
  view.webContents.on('render-process-gone', () => send('browser:error', 'Страница перезапустилась. Обнови вкладку.'));
  view.webContents.loadURL(normalizeUrl(url));
  activeId = id;
  layoutViews();
  publishTabs();
  return tab;
}
function activeTab() { return tabs.find(t => t.id === activeId); }
function activateTab(id) {
  if (!tabs.some(t => t.id === Number(id))) return;
  activeId = Number(id); layoutViews(); publishTabs();
}
function closeTab(id) {
  const index = tabs.findIndex(t => t.id === Number(id));
  if (index < 0) return;
  const wasActive = tabs[index].id === activeId;
  tabs[index].view.webContents.close();
  tabs.splice(index, 1);
  if (!tabs.length) createTab();
  else if (wasActive) activeId = tabs[Math.max(0, index - 1)].id;
  layoutViews(); publishTabs();
}
function createWindow() {
  win = new BrowserWindow({
    width: 1440, height: 920, minWidth: 760, minHeight: 560,
    backgroundColor: '#101116',
    title: 'LIQRA Browser',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  win.loadFile('index.html');
  win.on('resize', layoutViews);
  win.on('closed', () => { win = null; tabs = []; activeId = null; });
  win.webContents.on('did-finish-load', () => { if (!tabs.length) createTab(); });
}
ipcMain.handle('tab:new', (_, url) => createTab(url).id);
ipcMain.handle('tab:activate', (_, id) => activateTab(id));
ipcMain.handle('tab:close', (_, id) => closeTab(id));
ipcMain.handle('browser:navigate', (_, input) => { const t = activeTab(); if (t) t.view.webContents.loadURL(normalizeUrl(input)); });
ipcMain.handle('browser:back', () => { const t = activeTab(); if (t?.view.webContents.navigationHistory.canGoBack()) t.view.webContents.navigationHistory.goBack(); });
ipcMain.handle('browser:forward', () => { const t = activeTab(); if (t?.view.webContents.navigationHistory.canGoForward()) t.view.webContents.navigationHistory.goForward(); });
ipcMain.handle('browser:reload', () => { const t = activeTab(); if (t) t.view.webContents.reload(); });
ipcMain.handle('browser:home', () => { const t = activeTab(); if (t) t.view.webContents.loadURL('https://www.google.com'); });
ipcMain.handle('browser:external', (_, url) => shell.openExternal(url));
ipcMain.handle('browser:state', () => ({ tabs: tabs.map(publicTab), activeId }));
app.whenReady().then(createWindow);
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });