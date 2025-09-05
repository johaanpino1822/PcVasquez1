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
  
  // 2. Bloquear globales de Wompi de forma PERMANENTE
  const blockWompiGlobals = () => {
    const globalNames = ['$wompi', 'Wompi', 'wompi'];
    
    globalNames.forEach(name => {
      Object.defineProperty(window, name, {
        value: null,
        writable: false,
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
        node.src.includes('api.wompi.co')
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
            value.includes('api.wompi.co')
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
  
  // Ejecutar todas las protecciones
  removeAllWompiScripts();
  blockWompiGlobals();
  blockDomMethods();
  blockDynamicImports();
  
  console.log('✅ Bloqueo nuclear del SDK Wompi completado');
})();

export default {};