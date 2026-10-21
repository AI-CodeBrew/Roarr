(function(){
  window.initImpactStatDials = function(root) {
    if(!root) return;
    
    const anim = dial => {
      if(dial.dataset.animated === '1') return;
      dial.dataset.animated = '1';
      
      const svg = dial.querySelector('.impact__svg');
      const track = dial.querySelector('.impact__track');
      const prog = dial.querySelector('.impact__progress');
      const textEl = dial.querySelector('.impact__dial-text');
      
      if(!svg || !track || !prog || !textEl) return;
      
      const percent = Math.max(0, Math.min(100, Number(dial.dataset.percent || 0)));
      const size = 86;
      const stroke = 10;
      // Get color from CSS variable, fallback to default
      const root = dial.closest('.impact');
      const computedStyle = root ? getComputedStyle(root) : null;
      const color = computedStyle ? computedStyle.getPropertyValue('--impact-primary-color').trim() || '#E02626' : '#E02626';
      const trackColor = '#F1F1F1';
      const duration = 1200;
      
      svg.style.width = size + 'px';
      svg.style.height = size + 'px';
      track.setAttribute('stroke-width', stroke);
      track.setAttribute('stroke', trackColor);
      prog.setAttribute('stroke-width', stroke);
      prog.setAttribute('stroke', color);
      textEl.style.color = color;
      
      const r = 45;
      const C = 2 * Math.PI * r;
      prog.style.strokeDasharray = C;
      prog.style.strokeDashoffset = C;
      
      const start = performance.now();
      const endVal = percent;
      
      const tick = now => {
        const t = Math.min(1, (now - start) / duration);
        const v = Math.round(endVal * t);
        textEl.innerHTML = v + '<small>%</small>';
        prog.style.strokeDashoffset = C * (1 - (v / 100));
        if(t < 1) requestAnimationFrame(tick);
      };
      
      requestAnimationFrame(tick);
    };
    
    // Reset all dials and re-animate
    root.querySelectorAll('.impact__dial').forEach(d => d.dataset.animated = '');
    root.querySelectorAll('.impact__dial').forEach(anim);
  };
  
  // Auto-initialize all impact stat blocks on page load
  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('.impact').forEach(root => {
        window.initImpactStatDials(root);
      });
    });
  } else {
    document.querySelectorAll('.impact').forEach(root => {
      window.initImpactStatDials(root);
    });
  }
  
  // Re-animate when block is selected in Shopify editor
  document.addEventListener('shopify:block:select', e => {
    const root = e.target.closest('.impact');
    if(root && window.initImpactStatDials) {
      window.initImpactStatDials(root);
    }
  });
})();

