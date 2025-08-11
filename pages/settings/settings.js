const app = getApp();

Page({
  data: {
    settings: { theme: 'light', fontSize: 'medium', autoSave: true, notifications: true },
    themes: ['light', 'dark', 'auto'],
    fontSizes: ['small', 'medium', 'large'],
    selectedThemeIndex: 0,
    selectedFontSizeIndex: 1,
    cacheStats: { notesCount: 0, settingsSaved: 'No', lastUpdate: 'Nunca' },
    systemInfo: {},
    fromPage: '',
    // Stack debug
    showStackPanel: true,
    stackCurrent: [],
    stackPrev: [],
    stackMeta: {
      action: '',
      timestamp: '',
      depthChange: 0,
      addedRoutes: [],
      removedRoutes: []
    }
  },

  onLoad(query) {
    console.log('Settings page onLoad', query);
    if (query.from) this.setData({ fromPage: query.from });
    this.loadSettings();
    this.loadSystemInfo();
    this.updateCacheStats();
    this.updateStackInfo('onLoad');
  },

  onShow() {
    console.log('Settings page onShow');
    this.updateCacheStats();
    this.updateStackInfo('onShow');
  },

  onReady() { console.log('Settings page onReady'); },
  onHide() { console.log('Settings page onHide'); },
  onUnload() { console.log('Settings page onUnload'); },

  toggleStackPanel() { this.setData({ showStackPanel: !this.data.showStackPanel }); },

  updateStackInfo(source) {
    const current = app.getStackSummary();
    const prevSnap = app.getLastSnapshot();
    const prev = prevSnap ? prevSnap.stack : [];
    const diff = app.calcStackDiff(prev, current);
    this.setData({
      stackCurrent: current,
      stackPrev: prev,
      stackMeta: {
        action: prevSnap ? prevSnap.action : '',
        timestamp: prevSnap ? prevSnap.timestamp : '',
        depthChange: diff.depthChange,
        addedRoutes: diff.addedRoutes,
        removedRoutes: diff.removedRoutes,
        source
      }
    });
  },

  // Configuración
  loadSettings() {
    try {
      const settingsData = my.getStorageSync({ key: 'settings' });
      if (settingsData.data) {
        const settings = settingsData.data;
        const themeIndex = this.data.themes.indexOf(settings.theme);
        const fontSizeIndex = this.data.fontSizes.indexOf(settings.fontSize);
        this.setData({
          settings,
          selectedThemeIndex: themeIndex >= 0 ? themeIndex : 0,
          selectedFontSizeIndex: fontSizeIndex >= 0 ? fontSizeIndex : 1
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      my.showToast({ content: 'Error al cargar configuración', type: 'fail' });
    }
  },

  loadSystemInfo() {
    my.getSystemInfo({
      success: (res) => this.setData({ systemInfo: res }),
      fail: (error) => console.error('Error getting system info:', error)
    });
  },

  updateCacheStats() {
    try {
      const notesData = my.getStorageSync({ key: 'notes' });
      const notesCount = notesData.data ? notesData.data.length : 0;
      const settingsData = my.getStorageSync({ key: 'settings' });
      const settingsSaved = settingsData.data ? 'Sí' : 'No';
      this.setData({
        cacheStats: { notesCount, settingsSaved, lastUpdate: new Date().toLocaleTimeString() }
      });
    } catch (error) {
      console.error('Error updating cache stats:', error);
    }
  },

  saveSettings() {
    try {
      my.setStorageSync({ key: 'settings', data: this.data.settings });
      this.updateCacheStats();
      my.showToast({ content: 'Configuración guardada', type: 'success' });
    } catch (error) {
      console.error('Error saving settings:', error);
      my.showToast({ content: 'Error al guardar configuración', type: 'fail' });
    }
  },

  onThemeChange(e) {
    const index = e.detail.value;
    const theme = this.data.themes[index];
    this.setData({ selectedThemeIndex: index, 'settings.theme': theme });
    this.saveSettings();
  },

  onFontSizeChange(e) {
    const index = e.detail.value;
    const fontSize = this.data.fontSizes[index];
    this.setData({ selectedFontSizeIndex: index, 'settings.fontSize': fontSize });
    this.saveSettings();
  },

  onAutoSaveChange(e) {
    this.setData({ 'settings.autoSave': e.detail.value });
    this.saveSettings();
  },

  onNotificationsChange(e) {
    this.setData({ 'settings.notifications': e.detail.value });
    this.saveSettings();
  },

  refreshCacheStats() {
    this.updateCacheStats();
    my.showToast({ content: 'Estadísticas actualizadas', type: 'success' });
  },

  clearAllCache() {
    my.confirm({
      title: 'Confirmar',
      content: '¿Limpiar todo el cache? Se perderán notas y configuraciones.',
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar',
      success: (result) => {
        if (result.confirm) {
          try {
            my.removeStorageSync({ key: 'notes' });
            my.removeStorageSync({ key: 'settings' });
            my.removeStorageSync({ key: 'userData' });
            my.removeStorageSync({ key: 'visitCount' });
            my.removeStorageSync({ key: 'testData' });
            my.removeStorageSync({ key: 'tempNoteCache' });
            getApp().initializeCache();
            this.loadSettings();
            this.updateCacheStats();
            my.showToast({ content: 'Cache limpiado completamente', type: 'success' });
          } catch (error) {
            console.error('Error clearing cache:', error);
            my.showToast({ content: 'Error al limpiar cache', type: 'fail' });
          }
        }
      }
    });
  },

  goToNotes() {
    app.snapshotStack('navigateTo', {
      to: '/pages/notes/notes',
      from: (this.$page && this.$page.fullPath) || (this.route || 'pages/settings/settings')
    });
    my.navigateTo({ url: '/pages/notes/notes' });
  },

  goBack() {
    app.snapshotStack('navigateBack', {
      from: (this.$page && this.$page.fullPath) || (this.route || 'pages/settings/settings')
    });
    my.navigateBack({
      fail: () => {
        my.switchTab({ url: '/pages/index/index' });
      }
    });
  }
});
