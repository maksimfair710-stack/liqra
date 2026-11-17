const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('liqra', {
  newTab: url => ipcRenderer.invoke('tab:new', url),
  activateTab: id => ipcRenderer.invoke('tab:activate', id),
  closeTab: id => ipcRenderer.invoke('tab:close', id),
  navigate: url => ipcRenderer.invoke('browser:navigate', url),
  back: () => ipcRenderer.invoke('browser:back'),
  forward: () => ipcRenderer.invoke('browser:forward'),
  reload: () => ipcRenderer.invoke('browser:reload'),
  home: () => ipcRenderer.invoke('browser:home'),
  state: () => ipcRenderer.invoke('browser:state'),
  onTabs: callback => ipcRenderer.on('tabs:changed', (_, data) => callback(data)),
  onError: callback => ipcRenderer.on('browser:error', (_, message) => callback(message))
});