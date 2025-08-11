const app = getApp();

Page({
  data: {
    info: { keys: [], currentSize: 0, limitSize: 0 },
    keys: [],
    // stack
    showStackPanel: true,
    stackCurrent: [],
    stackPrev: [],
    stackMeta: { action: '', timestamp: '', depthChange: 0, addedRoutes: [], removedRoutes: [] }
  },

  onLoad(query) {
    this.loadInfo();
    this.updateStackInfo('onLoad');
  },

  onShow() {
    this.loadInfo();
    this.updateStackInfo('onShow');
  },

  onPullDownRefresh() {
    this.loadInfo();
    my.stopPullDownRefresh();
  },

  loadInfo() {
    const that = this;
    my.getStorageInfo({
      success(res) {
        // res.keys, currentSize, limitSize
        const items = [];
        for (var i = 0; i < res.keys.length; i++) {
          var key = res.keys[i];
          var valuePreview = '';
          var type = 'unknown';
          try {
            var dataRes = my.getStorageSync({ key: key });
            var data = dataRes && dataRes.data;
            type = Object.prototype.toString.call(data).slice(8, -1).toLowerCase();
            var str = '';
            try {
              str = JSON.stringify(data);
            } catch (e) {
              str = String(data);
            }
            // recortar preview
            valuePreview = str.length > 140 ? str.slice(0, 140) + '…' : str;
          } catch (e) {
            valuePreview = '[Error al leer]';
          }
          items.push({ key: key, preview: valuePreview, type: type });
        }
        that.setData({ info: res, keys: items });
      }
    });
  },

  clearTemp() {
    try {
      my.removeStorageSync({ key: 'tempNoteCache' });
      my.showToast({ content: 'tempNoteCache eliminado', type: 'success' });
      this.loadInfo();
    } catch (e) {
      my.showToast({ content: 'Error al eliminar', type: 'fail' });
    }
  },

  refresh() {
    this.loadInfo();
  },

  openDetail(e) {
    var key = e.currentTarget.dataset.key;
    app.snapshotStack('navigateTo', {
      to: '/pages/cache2/cache2?key=' + encodeURIComponent(key),
      from: (this.$page && this.$page.fullPath) || (this.route || 'pages/cache1/cache1')
    });
    my.navigateTo({
      url: '/pages/cache2/cache2?key=' + encodeURIComponent(key)
    });
  },

  goToCache2() {
    app.snapshotStack('navigateTo', {
      to: '/pages/cache2/cache2',
      from: (this.$page && this.$page.fullPath) || (this.route || 'pages/cache1/cache1')
    });
    my.navigateTo({ url: '/pages/cache2/cache2' });
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
