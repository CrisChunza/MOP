const app = getApp();

Page({
  data: {
    notes: [],
    filteredNotes: [],
    searchText: '',
    activeFilter: 'all',
    loading: true,
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
    console.log('Notes page onLoad', query);
    this.loadNotes();
    this.updateStackInfo('onLoad');
  },

  onShow() {
    console.log('Notes page onShow');
    this.loadNotes();
    this.updateStackInfo('onShow');
  },

  onReady() { console.log('Notes page onReady'); },
  onHide() { console.log('Notes page onHide'); },
  onUnload() { console.log('Notes page onUnload'); },

  onPullDownRefresh() {
    this.loadNotes();
    my.stopPullDownRefresh();
  },

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

  // Cargar notas desde cache
  loadNotes() {
    this.setData({ loading: true });
    try {
      const notesData = my.getStorageSync({ key: 'notes' });
      const notes = notesData.data || [];
      const formattedNotes = notes.map(note => ({
        ...note,
        formattedDate: app.utils.formatDate(note.date)
      }));
      this.setData({ notes: formattedNotes, loading: false });
      this.applyFilters();
    } catch (error) {
      console.error('Error loading notes:', error);
      this.setData({ loading: false });
      my.showToast({ content: 'Error al cargar notas', type: 'fail' });
    }
  },

  applyFilters() {
    let filtered = [...this.data.notes];
    if (this.data.activeFilter !== 'all') {
      filtered = filtered.filter(note => note.category === this.data.activeFilter);
    }
    if (this.data.searchText) {
      const searchLower = this.data.searchText.toLowerCase();
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(searchLower) ||
        note.content.toLowerCase().includes(searchLower)
      );
    }
    this.setData({ filteredNotes: filtered });
  },

  onSearchInput(e) {
    this.setData({ searchText: e.detail.value });
    this.applyFilters();
  },

  filterNotes(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({ activeFilter: filter });
    this.applyFilters();
  },

  viewNote(e) {
    const noteId = e.currentTarget.dataset.id;
    app.snapshotStack('navigateTo', {
      to: `/pages/detail/detail?id=${noteId}`,
      from: (this.$page && this.$page.fullPath) || (this.route || 'pages/notes/notes')
    });
    my.navigateTo({
      url: `/pages/detail/detail?id=${noteId}`
    });
  },

  createNote() {
    app.snapshotStack('navigateTo', {
      to: '/pages/detail/detail?mode=create',
      from: (this.$page && this.$page.fullPath) || (this.route || 'pages/notes/notes')
    });
    my.navigateTo({ url: '/pages/detail/detail?mode=create' });
  },

  goBack() {
    app.snapshotStack('navigateBack', {
      from: (this.$page && this.$page.fullPath) || (this.route || 'pages/notes/notes')
    });
    my.navigateBack({
      fail: () => {
        my.switchTab({ url: '/pages/index/index' });
      }
    });
  },

  goToIndex() {
    app.snapshotStack('switchTab', {
      to: '/pages/index/index',
      from: (this.$page && this.$page.fullPath) || (this.route || 'pages/notes/notes')
    });
    my.switchTab({ url: '/pages/index/index' });
  },

  // Redirigir a la primera página de cache
  redirectToCache1() {
    const app = getApp();
    app.snapshotStack('redirectTo', {
      to: '/pages/cache1/cache1',
      from: (this.$page && this.$page.fullPath) || (this.route || 'pages/notes/notes')
    });
    my.redirectTo({
      url: '/pages/cache1/cache1'
    });
  }
});
