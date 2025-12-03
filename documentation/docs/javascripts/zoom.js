document$.subscribe(function() {
  console.log("Zoom script initialized (Panzoom version)");

  function enableZoom(container) {
    // Prevent double-init
    if (container.getAttribute('data-zoom-init') === 'true') return;
    
    
    try {
      // Panzoom requires a parent wrapper for the overflow, 
      // and a child for the zooming.
      // The .mermaid div usually contains the shadow-root directly.
      
      // 1. Create a wrapper to handle the "crop" (overflow: hidden)
      var wrapper = document.createElement('div');
      wrapper.style.overflow = 'hidden';
      wrapper.style.border = '1px solid #e0e0e0';
      wrapper.style.height = 'fit-content';
      wrapper.style.cursor = 'grab';
      wrapper.style.position = 'relative';
      
      // 2. Insert wrapper before container
      container.parentNode.insertBefore(wrapper, container);
      
      // 3. Move container into wrapper
      wrapper.appendChild(container);
      
      // 4. Initialize Panzoom on the container
      var instance = Panzoom(container, {
        maxScale: 10,
        minScale: 0.1,
        bounds: true,
        boundsPadding: 0.5,
        contain: 'outside',
        startScale: 1,
        step: 0.05
      });

      // 5. Enable mouse wheel
      wrapper.addEventListener('wheel', instance.zoomWithWheel);

      // Mark as done
      container.setAttribute('data-zoom-init', 'true');
      console.log("Panzoom attached to container:", container);
      
    } catch (e) {
      console.error("Panzoom init failed:", e);
    }
  }

  // Use MutationObserver to wait for the diagrams to appear
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1) { 
          // Check for the class name you saw in inspector
          if (node.classList && node.classList.contains("mermaid")) {
             enableZoom(node);
          }
          // Check nested
          var nested = node.querySelectorAll(".mermaid");
          nested.forEach(enableZoom);
        }
      });
    });
  });

  // Start watching
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Also check immediately in case they are already there
  document.querySelectorAll(".mermaid").forEach(enableZoom);
});