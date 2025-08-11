const app = getApp();

Page({
  data: {
    selectedKey: '',
    selectedValue: '',
    all: [],
    // stack
    showStackPanel: true,
    stackCurrent: [],
    stackPrev: [],
    stackMeta: { action: '', timestamp: '', depthChange: 0, addedRoutes: [], removedRoutes: [] }
  },

  onLoad(query) {
    if (query && query.key) {
      this.setData({ selectedKey: query.key });
    }
    this.loadData();
    this.updateStackInfo('onLoad');
  },

  onShow() {
    this.loadData();
    this.updateStackInfo('onShow');
  },

  onPullDownRefresh() {
    this.loadData();
    my.stopPullDownRefresh();
  },

  loadData() {
    var that = this;
    if (this.data.selectedKey) {
      try {
        var res = my.getStorageSync({ key: this.data.selectedKey });
        var v = '';
        try {
          v = JSON.stringify(res && res.data, null, 2);
        } catch (e) {
          v = String(res && res.data);
        }
        that.setData({ selectedValue: v });
      } catch (e) {
        that.setData({ selectedValue: '[Error al leer]' });
      }
    } else {
      my.getStorageInfo({
        success(info) {
          var list = [];
          for (var i = 0; i < info.keys.length; i++) {
            var k = info.keys[i];
            try {
              var r = my.getStorageSync({ key: k });
              var s = '';
              try {
                s = JSON.stringify(r && r.data, null, 2);
              } catch (e2) {
                s = String(r && r.data);
              }
              list.push({ key: k, value: s });
            } catch (e) {
              list.push({ key: k, value: '[Error al leer]' });
            }
          }
          that.setData({ all: list });
        }
      });
    }
  },

  removeSelected() {
    var key = this.data.selectedKey;
    if (!key) return;
    var that = this;
    my.confirm({
      title: 'Eliminar clave',
      content: '¿Eliminar "' + key + '" del caché?',
      success(res) {
        if (res.confirm) {
          try {
            my.removeStorageSync({ key: key });
            my.showToast({ content: 'Clave eliminada', type: 'success' });
            that.setData({ selectedValue: '' });
            that.loadData();
          } catch (e) {
            my.showToast({ content: 'Error al eliminar', type: 'fail' });
          }
        }
      }
    });
  },

  goBack() {
    app.snapshotStack('navigateBack', {
      from: (this.$page && this.$page.fullPath) || (this.route || 'pages/cache2/cache2')
    });
    my.navigateBack();
  },

  goToCache1() {
    app.snapshotStack('navigateTo', {
      to: '/pages/cache1/cache1',
      from: (this.$page && this.$page.fullPath) || (this.route || 'pages/cache2/cache2')
    });
    my.navigateTo({ url: '/pages/cache1/cache1' });
  },

  // stack helpers
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
        source: source
      }
    });
  }
});
