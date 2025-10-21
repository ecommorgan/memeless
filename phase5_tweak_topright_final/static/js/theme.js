
(function(){
  const select = document.getElementById('themeSelect');
  function applyTheme(theme){
    if(theme === 'system'){
      const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', prefers);
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }
  const saved = localStorage.getItem('hp_theme') || 'system';
  if(select) select.value = saved;
  applyTheme(saved);
  if(select){
    select.addEventListener('change', ()=>{ const v = select.value; localStorage.setItem('hp_theme', v); applyTheme(v); });
  }
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e=>{
    const saved = localStorage.getItem('hp_theme') || 'system';
    if(saved === 'system') applyTheme('system');
  });
})();
