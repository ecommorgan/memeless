async function fetchPrices(){
  try{
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin&vs_currencies=usd');
    const data = await res.json();
    const content = document.getElementById('ticker-content');
    if(!content) return;
    content.innerHTML = '';
    const coins = [
      {id:'bitcoin', symbol:'BTC', logo:'https://cryptologos.cc/logos/bitcoin-btc-logo.png'},
      {id:'ethereum', symbol:'ETH', logo:'https://cryptologos.cc/logos/ethereum-eth-logo.png'},
      {id:'binancecoin', symbol:'BNB', logo:'https://cryptologos.cc/logos/binance-coin-bnb-logo.png'}
    ];
    coins.forEach(c=>{
      const price = data[c.id] ? Number(data[c.id].usd).toLocaleString() : 'N/A';
      const el = document.createElement('span');
      el.className = 'ticker-item';
      el.innerHTML = `<img src="${c.logo}" width="18" height="18" /> ${c.symbol}: $${price}`;
      content.appendChild(el);
    });
  }catch(e){
    console.error('price error',e);
  }
}
fetchPrices();
setInterval(fetchPrices,60000);

// Toast stacking and helper
window.showToast = function(message, type='info'){
  const container = document.getElementById('toast-container');
  if(!container) return;
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = message;
  container.appendChild(t);
  // show
  setTimeout(()=> t.classList.add('show'), 50);
  // hide & remove
  setTimeout(()=>{
    t.classList.remove('show');
    setTimeout(()=> t.remove(), 350);
  }, 2500);
};