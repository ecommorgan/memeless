// 🔒 Prevent reload loops by clearing wallet before anything else runs
if (window.location.pathname.includes('login')) {
  localStorage.removeItem('connectedWallet');
}


if (window.location.pathname.includes('login')) {
}


// Memeless global wallet connector (MetaMask + Phantom) with session + redirect
(function(){
  const LS_KEY = 'connectedWallet';
  const walletBtnSelector = '#connectWalletBtn';
  const autofillLinkSelector = '#wcLink';
  const walletFieldSelector = 'input[name="wallet_address"]';
  const dashboardPath = '/dashboard';
  const loginPath = '/';
  let lastAddr = null;

  function $sel(q){ return document.querySelector(q); }
  function shorten(addr){ return addr ? addr.slice(0,6) + '…' + addr.slice(-4) : ''; }
  function setWalletField(addr){ const el = document.querySelector(walletFieldSelector); if (el) el.value = addr; }
  function toast(message, type='info'){
    const t = document.createElement('div');
    t.textContent = message;
    t.style.position='fixed'; t.style.top='14px'; t.style.right='14px';
    t.style.padding='10px 14px'; t.style.borderRadius='12px';
    t.style.zIndex=99999; t.style.color='#fff';
    t.style.background = type==='error' ? '#ff4d4d' : (type==='success' ? '#23ff64' : '#2a77ff');
    t.style.boxShadow='0 8px 24px rgba(0,0,0,.35)';
    document.body.appendChild(t); setTimeout(()=>t.remove(),2200);
  }
  function glowConnected(){
    const btn = $sel(walletBtnSelector); if(!btn) return;
    btn.dataset.connected = 'true';
    btn.textContent = '✅ Wallet Connected';
    btn.title = lastAddr ? ('Connected as ' + shorten(lastAddr)) : 'Connected';
    btn.style.background = 'linear-gradient(90deg,#23ff64,#8aff8a)';
    btn.style.color = '#001a2a';
    btn.style.boxShadow = '0 0 18px rgba(35,255,100,.45)';
  }
  function glowDisconnected(){
    const btn = $sel(walletBtnSelector); if(!btn) return;
    btn.dataset.connected = 'false';
    btn.textContent = 'Connect Wallet';
    btn.title = '';
    btn.style.background = 'linear-gradient(90deg,#2a77ff,#00c2ff)';
    btn.style.color = '';
    btn.style.boxShadow = '';
  }
  async function connectMetaMask(){
    if (!window.ethereum) throw new Error('MetaMask not found');
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts || !accounts[0]) throw new Error('No MetaMask account available');
    return accounts[0];
  }
  async function connectPhantom(){
    if (!window.solana || !window.solana.isPhantom) throw new Error('Phantom not found');
    const resp = await window.solana.connect();
    if (!resp || !resp.publicKey) throw new Error('No Phantom account available');
    return resp.publicKey.toString();
  }
  async function connectWallet(){
    try{
      if (window.ethereum){ lastAddr = await connectMetaMask(); }
      else if (window.solana && window.solana.isPhantom){ lastAddr = await connectPhantom(); }
      else { throw new Error('No wallet detected. Install MetaMask or Phantom.'); }
      localStorage.setItem(LS_KEY, lastAddr);
      setWalletField(lastAddr);
      glowConnected();
      toast('🔗 Wallet connected','success');
      if (window.location.pathname.includes('login')) { return; }
      if (window.location.pathname.includes('login')) {
        toast('Wallet connected. Please enter your password to log in.', 'success');
        return;
      }
      // fetch('/auto_login', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({wallet_address: lastAddr})}).then(r=>r.json()).then(d=>{ if(d.status==='ok' && d.redirect){ window.location = d.redirect; } else { console.warn(d); } }).catch(console.warn);
      if (location.pathname === '/' || location.pathname.startsWith('/login')){
        setTimeout(()=>{ window.location = dashboardPath; }, 250);
      }
    }catch(e){ console.warn(e); toast(`⚠️ ${e.message || 'Wallet connect failed'}`,'error'); }
  }
  function autoReconnect(){
    const saved = localStorage.getItem(LS_KEY);
    if(!saved){ glowDisconnected(); return; }
    lastAddr = saved; setWalletField(saved); glowConnected();
    if (location.pathname === '/' || location.pathname.startsWith('/login')){
      setTimeout(()=>{ window.location = dashboardPath; }, 50);
    }
  }
  function attach(){
    const btn = $sel(walletBtnSelector); if (btn) btn.addEventListener('click', connectWallet);
    const wc = $sel(autofillLinkSelector); if (wc) wc.addEventListener('click', (e)=>{ e.preventDefault(); connectWallet(); });
  }
  window.MemelessWallet = {
    get: ()=> localStorage.getItem(LS_KEY),
    disconnect: ()=> { localStorage.removeItem(LS_KEY); glowDisconnected(); toast('🔌 Wallet disconnected','success'); setTimeout(()=>{ window.location = loginPath; }, 150); }
  }
  document.addEventListener('DOMContentLoaded', ()=>{ attach(); autoReconnect(); });
})();