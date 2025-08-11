const app = getApp();

Page({
  data: {
    note: { id: '', title: '', content: '', category: 'demo', date: '' },
    originalNote: {},
    isEditing: false,
    isCreating: false,
    loading: true,
    categories: ['demo', 'info', 'personal', 'work', 'other'],
    selectedCategoryIndex: 0,
    cacheInfo: '',
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
    console.log('Detail page onLoad', query);
    if (query.mode === 'create') {
      this.setData({
        isCreating: true,
        isEditing: true,
        loading: false,
        note: {
          id: app.utils.generateId(),
          title: '',
          content: '',
          category: 'demo',
          date: new Date().toISOString()
        }
      });
    } else if (query.id) {
      this.loadNote(query.id);
    } else {
      my.showToast({ content: 'ID de nota no válido', type: 'fail' });
      this.goBack();
    }
    this.updateStackInfo('onLoad');
  },

  onShow() {
    console.log('Detail page onShow');
    this.updateStackInfo('onShow');
  },

  onReady() { console.log('Detail page onReady'); },
  onHide() {
    console.log('Detail page onHide');
    if (this.data.isEditing && !this.data.isCreating) {
      this.saveToCache();
    }
  },
  onUnload() { console.log('Detail page onUnload'); },

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

  loadNote(noteId) {
    this.setData({ loading: true });
    try {
      const notesData = my.getStorageSync({ key: 'notes' });
      const notes = notesData.data || [];
      const note = notes.find(n => n.id == noteId);
      if (note) {
        const categoryIndex = this.data.categories.indexOf(note.category);
        this.setData({
          note: { ...note, formattedDate: app.utils.formatDate(note.date) },
          originalNote: { ...note },
          selectedCategoryIndex: categoryIndex >= 0 ? categoryIndex : 0,
          loading: false
        });
      } else {
        my.showToast({ content: 'Nota no encontrada', type: 'fail' });
        this.goBack();
      }
    } catch (error) {
      console.error('Error loading note:', error);
      this.setData({ loading: false });
      my.showToast({ content: 'Error al cargar nota', type: 'fail' });
    }
  },

  toggleEdit() {
    if (this.data.isEditing) {
      this.setData({ note: { ...this.data.originalNote }, isEditing: false });
    } else {
      this.setData({ originalNote: { ...this.data.note }, isEditing: true });
    }
  },

  onTitleInput(e) { this.setData({ 'note.title': e.detail.value }); },
  onContentInput(e) { this.setData({ 'note.content': e.detail.value }); },
  onCategoryChange(e) {
    const index = e.detail.value;
    this.setData({ selectedCategoryIndex: index, 'note.category': this.data.categories[index] });
  },

  saveNote() {
    const { note } = this.data;
    if (!note.title.trim()) { my.showToast({ content: 'El título es obligatorio', type: 'fail' }); return; }
    if (!note.content.trim()) { my.showToast({ content: 'El contenido es obligatorio', type: 'fail' }); return; }

    try {
      const notesData = my.getStorageSync({ key: 'notes' });
      let notes = notesData.data || [];
      if (this.data.isCreating) {
        notes.push({ ...note, date: new Date().toISOString() });
      } else {
        const index = notes.findIndex(n => n.id == note.id);
        if (index >= 0) {
          notes[index] = { ...note, date: notes[index].date };
        }
      }
      my.setStorageSync({ key: 'notes', data: notes });
      my.showToast({ content: this.data.isCreating ? 'Nota creada' : 'Nota guardada', type: 'success' });

      this.setData({ isEditing: false, originalNote: { ...note } });

      if (this.data.isCreating) {
        setTimeout(() => this.goBack(), 600);
        this.setData({ isCreating: false });
      }
    } catch (error) {
      console.error('Error saving note:', error);
      my.showToast({ content: 'Error al guardar nota', type: 'fail' });
    }
  },

  deleteNote() {
    my.confirm({
      title: 'Confirmar eliminación',
      content: '¿Eliminar esta nota?',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      success: (result) => {
        if (result.confirm) {
          try {
            const notesData = my.getStorageSync({ key: 'notes' });
            let notes = (notesData.data || []).filter(n => n.id != this.data.note.id);
            my.setStorageSync({ key: 'notes', data: notes });
            my.showToast({ content: 'Nota eliminada', type: 'success' });
            setTimeout(() => this.goBack(), 600);
          } catch (error) {
            console.error('Error deleting note:', error);
            my.showToast({ content: 'Error al eliminar nota', type: 'fail' });
          }
        }
      }
    });
  },

  saveToCache() {
    const cacheData = {
      noteId: this.data.note.id,
      title: this.data.note.title,
      content: this.data.note.content,
      timestamp: new Date().toISOString()
    };
    my.setStorageSync({ key: 'tempNoteCache', data: cacheData });
    this.setData({ cacheInfo: `Guardado: ${new Date().toLocaleTimeString()}` });
    my.showToast({ content: 'Guardado en cache temporal', type: 'success' });
  },

  loadFromCache() {
    try {
      const cacheData = my.getStorageSync({ key: 'tempNoteCache' });
      if (cacheData.data) {
        this.setData({ cacheInfo: `Cargado: ${new Date(cacheData.data.timestamp).toLocaleTimeString()}` });
        my.showToast({ content: 'Datos cargados desde cache', type: 'success' });
      } else {
        this.setData({ cacheInfo: 'No hay datos en cache' });
      }
    } catch (error) {
      console.error('Error loading from cache:', error);
      my.showToast({ content: 'Error al cargar cache', type: 'fail' });
    }
  },

  goBack() {
    app.snapshotStack('navigateBack', {
      from: (this.$page && this.$page.fullPath) || (this.route || 'pages/detail/detail')
    });
    my.navigateBack({
      fail: () => {
        my.navigateTo({ url: '/pages/notes/notes' });
      }
    });
  }
});
