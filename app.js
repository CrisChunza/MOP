App({
  globalData: {
    userInfo: null,
    version: '1.0.0',
    systemInfo: null
  },

  onLaunch(options) {
    console.log('App onLaunch', options);
    this.initializeCache();

    my.getSystemInfo({
      success: (res) => {
        console.log('System info:', res);
        this.globalData.systemInfo = res;
      }
    });
  },

  onShow() {
    console.log('App onShow');
  },

  onHide() {
    console.log('App onHide');
  },

  onError(error) {
    console.log('App onError', error);
  },

  // --------- Navegación: utilidades de pila ---------

  // Devuelve un resumen serializable de la pila actual de páginas
  getStackSummary() {
    try {
      const pages = getCurrentPages ? getCurrentPages() : [];
      const summary = pages.map((p, idx) => {
        const route = p && (p.route || (p.$page && p.$page.route) || p.__route__ || 'desconocido');
        const fullPath = (p && p.$page && p.$page.fullPath) ? p.$page.fullPath : '';
        const query = (p && (p.options || (p.$page && p.$page.query))) || {};
        return {
          index: idx,
          route,
          fullPath,
          query,
          queryText: this.utils.safeStringify(query)
        };
      });
      return summary;
    } catch (e) {
      console.warn('getStackSummary error:', e);
      return [];
    }
  },

  // Guarda una instantánea "antes de navegar" para poder compararla en la siguiente página
  snapshotStack(action, extra) {
    extra = extra || {};
    const stack = this.getStackSummary();
    const payload = {
      action: action,
      timestamp: new Date().toISOString(),
      extra: extra,
      stack: stack
    };
    try {
      my.setStorageSync({
        key: 'lastStackSnapshot',
        data: payload
      });
    } catch (e) {
      console.warn('snapshotStack error:', e);
    }
    return payload;
  },

  // Obtiene la última instantánea previa guardada
  getLastSnapshot() {
    try {
      const res = my.getStorageSync({ key: 'lastStackSnapshot' });
      return res && res.data ? res.data : null;
    } catch (e) {
      return null;
    }
  },

  // Calcula diff entre pilas (compatible sin optional chaining ni parámetros por defecto)
  calcStackDiff(prevStack, currStack) {
    // Normalizar entradas
    if (!Array.isArray(prevStack)) prevStack = [];
    if (!Array.isArray(currStack)) currStack = [];

    // Rutas representativas: intenta usar fullPath, si no, route
    function mapToRoute(arr) {
      var out = [];
      for (var i = 0; i < arr.length; i++) {
        var item = arr[i] || {};
        var r = item.fullPath || item.route || '';
        if (r) out.push(r);
      }
      return out;
    }

    var prevRoutes = mapToRoute(prevStack);
    var currRoutes = mapToRoute(currStack);

    // Diferencias simples
    var addedRoutes = [];
    for (var i = 0; i < currRoutes.length; i++) {
      if (prevRoutes.indexOf(currRoutes[i]) === -1) addedRoutes.push(currRoutes[i]);
    }

    var removedRoutes = [];
    for (var j = 0; j < prevRoutes.length; j++) {
      if (currRoutes.indexOf(prevRoutes[j]) === -1) removedRoutes.push(prevRoutes[j]);
    }

    // Unicidad (sin Set)
    function unique(arr) {
      var map = {};
      var out = [];
      for (var k = 0; k < arr.length; k++) {
        var v = arr[k];
        if (!map[v]) {
          map[v] = true;
          out.push(v);
        }
      }
      return out;
    }

    var currLen = currStack && currStack.length ? currStack.length : 0;
    var prevLen = prevStack && prevStack.length ? prevStack.length : 0;

    return {
      depthChange: currLen - prevLen,
      addedRoutes: unique(addedRoutes),
      removedRoutes: unique(removedRoutes)
    };
  },

  // --------- Inicialización de datos demo en caché ---------
  initializeCache() {
    try {
      const notes = my.getStorageSync({ key: 'notes' });
      if (!notes.data) {
        const defaultNotes = [
          {
            id: 1,
            title: 'Bienvenido a la Demo',
            content: 'Muestra navegación y manejo de caché en Alipay Mini Programs.',
            date: new Date().toISOString(),
            category: 'demo'
          },
          {
            id: 2,
            title: 'Funcionalidades',
            content: 'Crear, editar y eliminar notas. Datos en caché local.',
            date: new Date().toISOString(),
            category: 'info'
          }
        ];
        my.setStorageSync({ key: 'notes', data: defaultNotes });
      }

      const settings = my.getStorageSync({ key: 'settings' });
      if (!settings.data) {
        const defaultSettings = {
          theme: 'light',
          fontSize: 'medium',
          autoSave: true,
          notifications: true
        };
        my.setStorageSync({ key: 'settings', data: defaultSettings });
      }
    } catch (error) {
      console.error('Error initializing cache:', error);
    }
  },

  // --------- Utilidades varias ---------
  utils: {
    formatDate(dateString) {
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },
    generateId() {
      return Date.now() + Math.random().toString(36).substr(2, 9);
    },
    safeStringify(obj) {
      try {
        return JSON.stringify(obj || {}, null, 2);
      } catch (e) {
        return '[Unserializable]';
      }
    }
  }
});
