// Bloqueo AGRESIVO del SDK de Wompi - Ejecutar lo antes posible
(function() {
  if (typeof window === 'undefined') return;
  
  console.log('🛡️ Iniciando bloqueo nuclear del SDK Wompi...');
  
  // 1. Eliminar TODOS los scripts de Wompi existentes
  const removeAllWompiScripts = () => {
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      if (script.src && (
        script.src.includes('wompi') || 
        script.src.includes('checkout.wompi.co') ||
        script.src.includes('api.wompi.co') ||
        script.src.includes('widget.js')
      )) {
        console.log('🗑️ Eliminando script de Wompi:', script.src);
        script.remove();
      }
    });
  };
  
  // 2. Bloquear globales de Wompi de forma SEGURA
  const blockWompiGlobals = () => {
    const globalNames = ['$wompi', 'Wompi', 'wompi'];
    
    globalNames.forEach(name => {
      try {
        // Intentar redefinir si es configurable
        if (name in window) {
          const descriptor = Object.getOwnPropertyDescriptor(window, name);
          if (descriptor && descriptor.configurable) {
            Object.defineProperty(window, name, {
              value: null,
              writable: false,
              configurable: false,
              enumerable: false
            });
            console.log(`🔒 Bloqueado window.${name}`);
          } else {
            // Si no es configurable, usar proxy en el getter
            const originalValue = window[name];
            delete window[name];
            
            Object.defineProperty(window, name, {
              configurable: false,
              enumerable: false,
              get: function() {
                console.warn(`🚫 Acceso BLOQUEADO a window.${name}`);
                return null;
              },
              set: function(value) {
                console.warn(`🚫 Intento de asignación BLOQUEADO a window.${name}`);
              }
            });
            
            console.log(`🔒 Bloqueado window.${name} (no configurable)`);
          }
        } else {
          // Si no existe, crear propiedad bloqueada
          Object.defineProperty(window, name, {
            value: null,
            writable: false,
            configurable: false,
            enumerable: false
          });
          console.log(`🔒 Creado window.${name} bloqueado`);
        }
      } catch (error) {
        console.warn(`⚠️ No se pudo bloquear window.${name}:`, error.message);
      }
    });
  };
  
  // 3. Bloquear métodos de DOM para scripts
  const blockDomMethods = () => {
    // Bloquear appendChild
    const originalAppendChild = Element.prototype.appendChild;
    Element.prototype.appendChild = function(node) {
      if (node.src && node.src.includes && (
        node.src.includes('wompi') || 
        node.src.includes('checkout.wompi.co') ||
        node.src.includes('api.wompi.co') ||
        node.src.includes('widget.js')
      )) {
        console.log('🚫 Bloqueado appendChild de Wompi:', node.src);
        return node;
      }
      return originalAppendChild.call(this, node);
    };
    
    // Bloquear createElement
    const originalCreateElement = Document.prototype.createElement;
    Document.prototype.createElement = function(tagName, options) {
      const element = originalCreateElement.call(this, tagName, options);
      if (tagName.toLowerCase() === 'script') {
        const originalSetAttribute = element.setAttribute;
        element.setAttribute = function(name, value) {
          if (name === 'src' && value && (
            value.includes('wompi') || 
            value.includes('checkout.wompi.co') ||
            value.includes('api.wompi.co') ||
            value.includes('widget.js')
          )) {
            console.log('🚫 Bloqueado setAttribute de Wompi:', value);
            return;
          }
          return originalSetAttribute.call(this, name, value);
        };
      }
      return element;
    };
  };
  
  // 4. Bloquear importación dinámica
  const blockDynamicImports = () => {
    const originalImport = window.import;
    if (originalImport) {
      window.import = function() {
        const args = Array.from(arguments);
        if (args[0] && (
          args[0].includes('wompi') || 
          args[0].includes('checkout.wompi.co') ||
          args[0].includes('api.wompi.co')
        )) {
          console.log('🚫 Bloqueado dynamic import de Wompi:', args[0]);
          return Promise.reject(new Error('Wompi SDK bloqueado'));
        }
        return originalImport.apply(this, arguments);
      };
    }
  };
  
  // 5. Bloquear fetch/XMLHttpRequest para APIs de Wompi
  const blockApiRequests = () => {
    // Bloquear fetch
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
      if (url && url.includes('api.wompi.co')) {
        console.log('🚫 Bloqueado fetch a Wompi API:', url);
        return Promise.reject(new Error('Wompi API bloqueada'));
      }
      return originalFetch.apply(this, args);
    };
    
    // Bloquear XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
      if (url && url.includes('api.wompi.co')) {
        console.log('🚫 Bloqueado XMLHttpRequest a Wompi API:', url);
        throw new Error('Wompi API bloqueada');
      }
      return originalXHROpen.apply(this, arguments);
    };
  };
  
  // 6. Monitoreo continuo de scripts
  const startScriptMonitoring = () => {
    setInterval(() => {
      const wompiScripts = document.querySelectorAll('script[src*="wompi"], script[src*="checkout.wompi.co"], script[src*="api.wompi.co"]');
      if (wompiScripts.length > 0) {
        console.warn('⚠️ Scripts de Wompi detectados después del bloqueo. Eliminando...');
        wompiScripts.forEach(script => {
          console.log('🗑️ Eliminando script:', script.src);
          script.remove();
        });
      }
    }, 1000);
  };
  
  // Ejecutar todas las protecciones
  try {
    removeAllWompiScripts();
    blockWompiGlobals();
    blockDomMethods();
    blockDynamicImports();
    blockApiRequests();
    startScriptMonitoring();
    
    console.log('✅ Bloqueo nuclear del SDK Wompi completado');
  } catch (error) {
    console.error('❌ Error en el bloqueo:', error);
  }
})();

export default {};