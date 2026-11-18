'use strict';

(() => {
  const SAVE_KEY = 'pixel-adventure-save-v1';
  const HAIRSTYLES = [
    { name: '清爽短发', price: 0, color: '#34251e', kind: 'short' },
    { name: '赤焰侧分', price: 5, color: '#a33', kind: 'side' },
    { name: '金色双马尾', price: 9, color: '#fc3', kind: 'twin' },
    { name: '森林长发', price: 14, color: '#246b45', kind: 'long' },
    { name: '星月法师帽', price: 22, color: '#7252a3', kind: 'hat' },
    { name: '冒险家羽冠', price: 30, color: '#e77b35', kind: 'feather' }
  ];
  const OUTFITS = [
    { name: '旅行者便装', price: 0, color: '#fa0', accent: '#8b4b28', kind: 'plain' },
    { name: '海岛水手服', price: 6, color: '#168bd2', accent: '#f5f5e8', kind: 'sailor' },
    { name: '森林巡游装', price: 12, color: '#438849', accent: '#d8b653', kind: 'ranger' },
    { name: '皇家礼服', price: 20, color: '#9b4fc0', accent: '#ffd84a', kind: 'royal' },
    { name: '龙骑士铠甲', price: 32, color: '#c34b45', accent: '#d7dce5', kind: 'armor' },
    { name: '星空魔法袍', price: 45, color: '#263d80', accent: '#69e4eb', kind: 'mage' }
  ];

  function readSave() {
    try {
      const save = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
      if (!save.equip) save.equip = { cloth: 0, hair: 0, weapon: 0 };
      if (!save.wardrobe) save.wardrobe = { hair: 0, outfit: 0, ownedHair: [0], ownedOutfits: [0] };
      save.wardrobe.ownedHair = Array.isArray(save.wardrobe.ownedHair) ? [...new Set([0, ...save.wardrobe.ownedHair])] : [0];
      save.wardrobe.ownedOutfits = Array.isArray(save.wardrobe.ownedOutfits) ? [...new Set([0, ...save.wardrobe.ownedOutfits])] : [0];
      save.wardrobe.hair = Number.isInteger(save.wardrobe.hair) ? save.wardrobe.hair : 0;
      save.wardrobe.outfit = Number.isInteger(save.wardrobe.outfit) ? save.wardrobe.outfit : 0;
      return save;
    } catch (_) {
      return { gold: 0, equip: { cloth: 0, hair: 0, weapon: 0 }, wardrobe: { hair: 0, outfit: 0, ownedHair: [0], ownedOutfits: [0] } };
    }
  }

  function writeSave(save) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (_) {}
  }

  function drawAvatar(ctx, x, y, scale, hairIndex, outfitIndex) {
    const hair = HAIRSTYLES[hairIndex] || HAIRSTYLES[0];
    const outfit = OUTFITS[outfitIndex] || OUTFITS[0];
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = false;
    // Pixel-person silhouette, matching the game's 24 × 36 character proportions.
    ctx.fillStyle = '#e9b786'; ctx.fillRect(3, 0, 18, 14);
    ctx.fillStyle = outfit.color; ctx.fillRect(0, 14, 24, 18);
    ctx.fillStyle = outfit.accent;
    if (outfit.kind === 'sailor') { ctx.fillRect(9, 14, 6, 18); ctx.fillRect(3, 17, 18, 2); }
    if (outfit.kind === 'ranger') { ctx.fillRect(2, 14, 5, 15); ctx.fillRect(17, 14, 5, 15); ctx.fillRect(9, 14, 6, 3); }
    if (outfit.kind === 'royal') { ctx.fillRect(2, 14, 20, 3); ctx.fillRect(3, 28, 18, 4); ctx.fillRect(10, 18, 4, 4); }
    if (outfit.kind === 'armor') { ctx.fillRect(2, 16, 5, 11); ctx.fillRect(17, 16, 5, 11); ctx.fillRect(9, 18, 6, 6); ctx.fillRect(1, 14, 22, 3); }
    if (outfit.kind === 'mage') { ctx.fillRect(2, 14, 4, 16); ctx.fillRect(18, 14, 4, 16); ctx.fillRect(10, 20, 4, 4); }
    ctx.fillStyle = '#29364a'; ctx.fillRect(2, 32, 8, 4); ctx.fillRect(14, 32, 8, 4);
    ctx.fillStyle = '#222'; ctx.fillRect(6, 5, 3, 3); ctx.fillRect(15, 5, 3, 3);
    ctx.fillStyle = hair.color;
    if (hair.kind === 'short') { ctx.fillRect(2, -2, 20, 7); ctx.fillRect(2, 2, 4, 7); }
    if (hair.kind === 'side') { ctx.fillRect(2, -2, 20, 6); ctx.fillRect(15, 1, 7, 3); ctx.fillRect(2, 2, 4, 9); }
    if (hair.kind === 'twin') { ctx.fillRect(3, -2, 18, 5); ctx.fillRect(0, 1, 5, 13); ctx.fillRect(19, 1, 5, 13); ctx.fillRect(1, 0, 4, 3); ctx.fillRect(19, 0, 4, 3); }
    if (hair.kind === 'long') { ctx.fillRect(2, -2, 20, 6); ctx.fillRect(1, 2, 5, 16); ctx.fillRect(18, 2, 5, 16); }
    if (hair.kind === 'hat') { ctx.fillRect(1, -3, 22, 4); ctx.fillRect(5, -12, 14, 10); ctx.fillRect(9, -15, 6, 3); }
    if (hair.kind === 'feather') { ctx.fillRect(2, -2, 20, 6); ctx.fillRect(7, -9, 5, 8); ctx.fillRect(12, -13, 5, 12); ctx.fillRect(17, -8, 4, 7); }
    if (hair.kind === 'side' || hair.kind === 'long') ctx.fillRect(2, 1, 7, 4);
    ctx.restore();
  }

  window.drawEquippedPixelDetails = (ctx, x, y, save) => {
    const wardrobe = save.wardrobe || readSave().wardrobe;
    drawAvatar(ctx, x, y, 1, wardrobe.hair, wardrobe.outfit);
  };
  window.renderPixelShopAvatar = () => {
    const canvas = document.getElementById('char');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const save = readSave();
    drawAvatar(ctx, 48, 82, 2.5, save.wardrobe.hair, save.wardrobe.outfit);
  };

  function renderStore() {
    const shop = document.getElementById('shop');
    if (!shop) return;
    const center = shop.querySelector('.center');
    if (!center || center.dataset.pixelStore === 'ready') return;
    center.dataset.pixelStore = 'ready';
    center.innerHTML = '<h2>像素造型商店</h2><canvas id="char" width="160" height="220" aria-label="角色造型预览"></canvas><p id="wardrobeGold" aria-live="polite"></p><div class="wardrobeTabs"><button type="button" class="btn" data-tab="hair">发型</button><button type="button" class="btn" data-tab="outfit">服装</button></div><div id="wardrobeItems" class="wardrobeItems"></div><p class="note">金币不足时可闯关收集金币；价格会随造型复杂度提升。</p><button class="btn" type="button" id="wardrobeBack">返回关卡</button>';
    const style = document.createElement('style');
    style.textContent = '#shop .center{justify-content:flex-start;padding-top:18px;padding-bottom:24px}#shop #char{width:120px;height:165px;image-rendering:pixelated;margin:2px auto}#wardrobeGold{color:#ffd84a;margin:5px}.wardrobeTabs{display:flex;gap:8px}.wardrobeTabs .btn{min-width:110px}.wardrobeItems{width:min(100%,520px);display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:8px 0}.wardrobe-item{border:1px solid #52677e;border-radius:10px;background:#1d2c3d;color:#fff;padding:10px;text-align:left;cursor:pointer}.wardrobe-item.equipped{border-color:#ffd84a;box-shadow:0 0 0 1px #ffd84a inset}.wardrobe-item:disabled{opacity:.55}.wardrobe-item strong,.wardrobe-item span{display:block}.wardrobe-item span{color:#bdc9d5;font-size:12px;margin-top:3px}';
    document.head.appendChild(style);
    let tab = 'hair';
    const list = center.querySelector('#wardrobeItems');
    const gold = center.querySelector('#wardrobeGold');
    function refresh() {
      const save = readSave();
      writeSave(save);
      gold.textContent = `🪙 金币：${save.gold || 0}`;
      list.replaceChildren();
      const items = tab === 'hair' ? HAIRSTYLES : OUTFITS;
      const ownedKey = tab === 'hair' ? 'ownedHair' : 'ownedOutfits';
      const selectedKey = tab === 'hair' ? 'hair' : 'outfit';
      items.forEach((item, index) => {
        const owned = save.wardrobe[ownedKey].includes(index);
        const equipped = save.wardrobe[selectedKey] === index;
        const button = document.createElement('button');
        button.type = 'button'; button.className = `wardrobe-item${equipped ? ' equipped' : ''}`;
        button.innerHTML = `<strong>${item.name}${equipped ? ' · 已装备' : ''}</strong><span>${owned ? (equipped ? '当前造型' : '点击装备') : `购买价格：${item.price} 金币`}</span>`;
        button.disabled = !owned && (save.gold || 0) < item.price;
        button.addEventListener('click', () => {
          const latest = readSave();
          const wardrobe = latest.wardrobe;
          const owned = wardrobe[ownedKey].includes(index);
          if (!owned) {
            if ((latest.gold || 0) < item.price) { gold.textContent = '金币不足！闯关收集更多金币后再来购买。'; return; }
            latest.gold -= item.price;
            wardrobe[ownedKey].push(index);
          }
          wardrobe[selectedKey] = index;
          if (tab === 'hair') latest.equip.hair = index % 3;
          else latest.equip.cloth = index % 3;
          writeSave(latest);
          if (typeof window.saveProgress === 'function') window.saveProgress();
          window.renderPixelShopAvatar();
          refresh();
        });
        list.appendChild(button);
      });
      window.renderPixelShopAvatar();
      if (typeof window.updateGoldUI === 'function') window.updateGoldUI();
    }
    center.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => { tab = button.dataset.tab; refresh(); }));
    center.querySelector('#wardrobeBack').addEventListener('click', () => { if (typeof window.go === 'function') window.go('map'); });
    refresh();
  }

  function boot() {
    renderStore();
    const shop = document.getElementById('shop');
    if (shop) new MutationObserver(() => {
      if (shop.classList.contains('active')) { renderStore(); window.renderPixelShopAvatar(); }
    }).observe(shop, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('storage', () => { if (shop && shop.classList.contains('active')) renderStore(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
