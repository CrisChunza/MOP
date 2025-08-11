const app = getApp();

Page({
  data: {
    userInfo: {},
    lastVisit: '',
    visitCount: 0,
    cacheData: '',
    systemInfo: {},
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
    console.log('Index page onLoad', query);
    this.loadUserData();
    this.updateVisitCount();
    this.loadSystemInfo();
    this.updateStackInfo('onLoad');
  },

  onShow() {
    console.log('Index page onShow');
    this.loadUserData();
    this.updateStackInfo('onShow');
  },

  onReady() { console.log('Index page onReady'); },
  onHide() { console.log('Index page onHide'); },
  onUnload() { console.log('Index page onUnload'); },

  toggleStackPanel() {
    this.setData({ showStackPanel: !this.data.showStackPanel });
  },

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

  // Datos usuario/cache demo
  loadUserData() {
    try {
      const userData = my.getStorageSync({ key: 'userData' });
      if (userData.data) {
        this.setData({
          userInfo: userData.data,
          lastVisit: app.utils.formatDate(userData.data.lastVisit || new Date())
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  },

  updateVisitCount() {
    try {
      const visitData = my.getStorageSync({ key: 'visitCount' });
      const currentCount = visitData.data || 0;
      const newCount = currentCount + 1;
      my.setStorageSync({ key: 'visitCount', data: newCount });

      const userData = { name: 'Usuario Demo', lastVisit: new Date().toISOString() };
      my.setStorageSync({ key: 'userData', data: userData });

      this.setData({
        visitCount: newCount,
        userInfo: userData,
        lastVisit: app.utils.formatDate(userData.lastVisit)
      });
    } catch (error) {
      console.error('Error updating visit count:', error);
    }
  },

  loadSystemInfo() {
    my.getSystemInfo({
      success: (res) => this.setData({ systemInfo: res }),
      fail: (error) => console.error('Error getting system info:', error)
    });
  },

  // Navegación (con snapshot)
  navigateToNotes() {
    app.snapshotStack('navigateTo', {
      to: '/pages/notes/notes',
      from: (this.$page && this.$page.fullPath) || (this.route || 'pages/index/index')
    });
    my.navigateTo({
      url: '/pages/notes/notes',
      success: () => console.log('Navigate to notes success'),
      fail: (error) => {
        console.error('Navigate to notes failed:', error);
        my.showToast({ content: 'Error al navegar a notas', type: 'fail' });
      }
    });
  },

  navigateToSettings() {
    app.snapshotStack('navigateTo', {
      to: '/pages/settings/settings?from=index',
      from: (this.$page && this.$page.fullPath) || (this.route || 'pages/index/index')
    });
    my.navigateTo({
      url: '/pages/settings/settings?from=index'
    });
  },

  simulateRedirect() {
    app.snapshotStack('redirectTo', {
      to: '/pages/notes/notes',
      from: (this.$page && this.$page.fullPath) || (this.route || 'pages/index/index')
    });
    my.redirectTo({
      url: '/pages/notes/notes'
    });
  },

  simulateReLaunch() {
    app.snapshotStack('reLaunch', {
      to: '/pages/index/index',
      from: (this.$page && this.$page.fullPath) || (this.route || 'pages/index/index')
    });
    my.reLaunch({
      url: '/pages/index/index'
    });
  },

  // Cache demo
  saveToCache() {
    const testData = {
      message: 'Datos de prueba guardados',
      timestamp: new Date().toISOString(),
      randomNumber: Math.floor(Math.random() * 1000)
    };
    my.setStorage({
      key: 'testData',
      data: testData,
      success: () => {
        my.showToast({ content: 'Datos guardados en cache', type: 'success' });
        this.setData({ cacheData: JSON.stringify(testData, null, 2) });
      }
    });
  },

  readFromCache() {
    my.getStorage({
      key: 'testData',
      success: (res) => {
        this.setData({ cacheData: JSON.stringify(res.data, null, 2) });
        my.showToast({ content: 'Datos leídos del cache', type: 'success' });
      },
      fail: () => {
        my.showToast({ content: 'No hay datos en cache', type: 'fail' });
        this.setData({ cacheData: '' });
      }
    });
  },

  clearCache() {
    my.confirm({
      title: 'Confirmar',
      content: '¿Estás seguro de que quieres limpiar el cache?',
      confirmButtonText: 'Sí',
      cancelButtonText: 'No',
      success: (result) => {
        if (result.confirm) {
          my.removeStorage({
            key: 'testData',
            success: () => {
              this.setData({ cacheData: '' });
              my.showToast({ content: 'Cache limpiado', type: 'success' });
            }
          });
        }
      }
    });
  }
});
