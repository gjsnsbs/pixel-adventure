'use strict';

(() => {
  const SAVE_KEY = 'pixel-adventure-save-v1';
  const CATEGORIES = {
    hair: {
      label: '发型', ownedKey: 'ownedHair', selectedKey: 'hair',
      items: [
        { name: '清爽短发', price: 0, color: '#34251e', kind: 'short' },
        { name: '赤焰侧分', price: 5, color: '#a33', kind: 'side' },
        { name: '金色双马尾', price: 9, color: '#fc3', kind: 'twin' },
        { name: '森林长发', price: 14, color: '#246b45', kind: 'long' },
        { name: '星月法师帽', price: 22, color: '#7252a3', kind: 'hat' },
        { name: '冒险家羽冠', price: 30, color: '#e77b35', kind: 'feather' }
      ]
    },
    outfit: {
      label: '上衣', ownedKey: 'ownedOutfits', selectedKey: 'outfit',
      items: [
        { name: '旅行者便装', price: 0, color: '#fa0', accent: '#8b4b28', kind: 'plain' },
        { name: '海岛水手服', price: 6, color: '#168bd2', accent: '#f5f5e8', kind: 'sailor' },
        { name: '森林巡游装', price: 12, color: '#438849', accent: '#d8b653', kind: 'ranger' },
        { name: '皇家礼服', price: 20, color: '#9b4fc0', accent: '#ffd84a', kind: 'royal' },
        { name: '龙骑士铠甲', price: 32, color: '#c34b45', accent: '#d7dce5', kind: 'armor' },
        { name: '星空魔法袍', price: 45, color: '#263d80', accent: '#69e4eb', kind: 'mage' }
      ]
    },
    skirt: {
      label: '裙子', ownedKey: 'ownedSkirts', selectedKey: 'skirt',
      items: [
        { name: '轻盈短裙', price: 0, color: '#f3a5c8', accent: '#ffe2ef', kind: 'short' },
        { name: '森林叶片裙', price: 8, color: '#438849', accent: '#b7df83', kind: 'leaf' },
        { name: '星光百褶裙', price: 15, color: '#7252a3', accent: '#d9c6ff', kind: 'pleated' },
        { name: '皇家长裙', price: 25, color: '#c34b78', accent: '#ffd84a', kind: 'long' }
      ]
    },
    pants: {
      label: '裤子', ownedKey: 'ownedPants', selectedKey: 'pants',
      items: [
        { name: '冒险长裤', price: 0, color: '#29364a', accent: '#52677e', kind: 'long' },
        { name: '旅行短裤', price: 7, color: '#8b4b28', accent: '#d6a56c', kind: 'short' },
        { name: '蓝色牛仔裤', price: 13, color: '#2866a5', accent: '#82b9e8', kind: 'jeans' },
        { name: '骑士护腿', price: 22, color: '#697786', accent: '#d7dce5', kind: 'armor' }
      ]
    },
    shoes: {
      label: '鞋子', ownedKey: 'ownedShoes', selectedKey: 'shoes',
      items: [
        { name: '舒适布鞋', price: 0, color: '#493425', accent: '#8b6a4c', kind: 'cloth' },
        { name: '红色短靴', price: 6, color: '#b4433d', accent: '#f1b553', kind: 'boots' },
        { name: '轻巧运动鞋', price: 11, color: '#168bd2', accent: '#f5f5e8', kind: 'sneaker' },
        { name: '黄金骑士靴', price: 19, color: '#d39b27', accent: '#fff0a8', kind: 'gold' }
      ]
    },
    accessory: {
      label: '饰品', ownedKey: 'ownedAccessories', selectedKey: 'accessory',
      items: [
        { name: '无饰品', price: 0, color: '#f5f5e8', accent: '#f5f5e8', kind: 'none' },
        { name: '冒险者围巾', price: 8, color: '#e45d4d', accent: '#ffd84a', kind: 'scarf' },
        { name: '星星发夹', price: 12, color: '#ffd84a', accent: '#fff0a8', kind: 'star' },
        { name: '圆框眼镜', price: 16, color: '#4bd5d0', accent: '#d2ffff', kind: 'glasses' },
        { name: '小披风', price: 24, color: '#7252a3', accent: '#d9c6ff', kind: 'cape' }
      ]
    }
  };
  const CATEGORY_KEYS = Object.keys(CATEGORIES);

  function normalizeSave(save) {
    if (!save.equip || typeof save.equip !== 'object') save.equip = { cloth: 0, hair: 0, weapon: 0 };
    if (!save.wardrobe || typeof save.wardrobe !== 'object') {
      save.wardrobe = { hair: 0, outfit: 0, ownedHair: [0], ownedOutfits: [0] };
    }
    const wardrobe = save.wardrobe;
    CATEGORY_KEYS.forEach(key => {
      const { ownedKey, selectedKey } = CATEGORIES[key];
      const owned = Array.isArray(wardrobe[ownedKey]) ? wardrobe[ownedKey] : [0];
      wardrobe[ownedKey] = [...new Set([0, ...owned.filter(Number.isInteger)])];
      const selected = Number.isInteger(wardrobe[selectedKey]) ? wardrobe[selectedKey] : 0;
      wardrobe[selectedKey] = wardrobe[ownedKey].includes(selected) ? selected : 0;
    });
    // Older saves only had hair and outfits; preserve those selections as owned items.
    if (Array.isArray(wardrobe.ownedHair) && Number.isInteger(wardrobe.hair) && !wardrobe.ownedHair.includes(wardrobe.hair)) wardrobe.ownedHair.push(wardrobe.hair);
    if (Array.isArray(wardrobe.ownedOutfits) && Number.isInteger(wardrobe.outfit) && !wardrobe.ownedOutfits.includes(wardrobe.outfit)) wardrobe.ownedOutfits.push(wardrobe.outfit);
    return save;
  }

  function readSave() {
    try {
      return normalizeSave(JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'));
    } catch (_) {
      return normalizeSave({ gold: 0 });
    }
  }

  function writeSave(save) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (_) {}
  }

  function drawAvatar(ctx, x, y, scale, wardrobe) {
    const getItem = key => CATEGORIES[key].items[wardrobe[key]] || CATEGORIES[key].items[0];
    const hair = getItem('hair');
    const outfit = getItem('outfit');
    const skirt = getItem('skirt');
    const pants = getItem('pants');
    const shoes = getItem('shoes');
    const accessory = getItem('accessory');
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = false;

    // Pixel-person silhouette: 24 × 36, matching the game's character proportions.
    ctx.fillStyle = '#e9b786'; ctx.fillRect(3, 0, 18, 14);
    ctx.fillStyle = outfit.color; ctx.fillRect(2, 14, 20, 12);
    ctx.fillStyle = outfit.accent;
    if (outfit.kind === 'sailor') { ctx.fillRect(9, 14, 6, 12); ctx.fillRect(3, 17, 18, 2); }
    if (outfit.kind === 'ranger') { ctx.fillRect(2, 14, 5, 11); ctx.fillRect(17, 14, 5, 11); ctx.fillRect(9, 14, 6, 3); }
    if (outfit.kind === 'royal') { ctx.fillRect(2, 14, 20, 3); ctx.fillRect(10, 18, 4, 4); }
    if (outfit.kind === 'armor') { ctx.fillRect(2, 16, 5, 9); ctx.fillRect(17, 16, 5, 9); ctx.fillRect(9, 18, 6, 6); ctx.fillRect(1, 14, 22, 3); }
    if (outfit.kind === 'mage') { ctx.fillRect(2, 14, 4, 11); ctx.fillRect(18, 14, 4, 11); ctx.fillRect(10, 20, 4, 4); }

    // Bottoms layer over the legs; skirt and trousers can be mixed with any top.
    if (wardrobe.skirt > 0) {
      ctx.fillStyle = skirt.color; ctx.fillRect(1, 24, 22, skirt.kind === 'long' ? 10 : 7);
      ctx.fillStyle = skirt.accent;
      if (skirt.kind === 'pleated') { ctx.fillRect(5, 25, 2, 6); ctx.fillRect(11, 25, 2, 6); ctx.fillRect(17, 25, 2, 6); }
      if (skirt.kind === 'leaf') { ctx.fillRect(4, 26, 4, 2); ctx.fillRect(12, 29, 4, 2); }
    } else {
      ctx.fillStyle = pants.color; ctx.fillRect(3, 24, 7, 9); ctx.fillRect(14, 24, 7, 9);
      ctx.fillStyle = pants.accent;
      if (pants.kind === 'short') { ctx.fillRect(3, 24, 7, 4); ctx.fillRect(14, 24, 7, 4); }
      if (pants.kind === 'jeans') { ctx.fillRect(8, 25, 2, 7); ctx.fillRect(14, 25, 2, 7); }
      if (pants.kind === 'armor') { ctx.fillRect(4, 26, 5, 3); ctx.fillRect(15, 26, 5, 3); }
    }
    ctx.fillStyle = shoes.color; ctx.fillRect(2, 32, 9, 4); ctx.fillRect(13, 32, 9, 4);
    ctx.fillStyle = shoes.accent;
    if (shoes.kind !== 'cloth') { ctx.fillRect(3, 32, 6, 1); ctx.fillRect(14, 32, 6, 1); }

    ctx.fillStyle = '#222'; ctx.fillRect(6, 5, 3, 3); ctx.fillRect(15, 5, 3, 3);
    ctx.fillStyle = hair.color;
    if (hair.kind === 'short') { ctx.fillRect(2, -2, 20, 7); ctx.fillRect(2, 2, 4, 7); }
    if (hair.kind === 'side') { ctx.fillRect(2, -2, 20, 6); ctx.fillRect(15, 1, 7, 3); ctx.fillRect(2, 2, 4, 9); }
    if (hair.kind === 'twin') { ctx.fillRect(3, -2, 18, 5); ctx.fillRect(0, 1, 5, 13); ctx.fillRect(19, 1, 5, 13); ctx.fillRect(1, 0, 4, 3); ctx.fillRect(19, 0, 4, 3); }
    if (hair.kind === 'long') { ctx.fillRect(2, -2, 20, 6); ctx.fillRect(1, 2, 5, 16); ctx.fillRect(18, 2, 5, 16); }
    if (hair.kind === 'hat') { ctx.fillRect(1, -3, 22, 4); ctx.fillRect(5, -12, 14, 10); ctx.fillRect(9, -15, 6, 3); }
    if (hair.kind === 'feather') { ctx.fillRect(2, -2, 20, 6); ctx.fillRect(7, -9, 5, 8); ctx.fillRect(12, -13, 5, 12); ctx.fillRect(17, -8, 4, 7); }
    if (hair.kind === 'side' || hair.kind === 'long') ctx.fillRect(2, 1, 7, 4);

    ctx.fillStyle = accessory.color;
    if (accessory.kind === 'scarf') { ctx.fillRect(3, 13, 18, 3); ctx.fillRect(16, 15, 4, 6); }
    if (accessory.kind === 'star') { ctx.fillRect(17, 1, 4, 4); ctx.fillRect(18, 0, 2, 6); }
    if (accessory.kind === 'glasses') { ctx.fillRect(5, 5, 5, 1); ctx.fillRect(14, 5, 5, 1); ctx.fillRect(10, 6, 4, 1); ctx.fillRect(5, 8, 5, 1); ctx.fillRect(14, 8, 5, 1); }
    if (accessory.kind === 'cape') { ctx.fillRect(0, 15, 3, 14); ctx.fillRect(21, 15, 3, 14); ctx.fillRect(2, 14, 20, 2); }
    ctx.restore();
  }

  window.drawEquippedPixelDetails = (ctx, x, y, save) => {
    const current = normalizeSave(save && typeof save === 'object' ? save : readSave());
    drawAvatar(ctx, x, y, 1, current.wardrobe);
  };

  window.renderPixelShopAvatar = () => {
    const canvas = document.getElementById('char');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawAvatar(ctx, 48, 82, 2.5, readSave().wardrobe);
  };

  function renderStore() {
    const shop = document.getElementById('shop');
    if (!shop) return;
    const center = shop.querySelector('.center');
    if (!center || center.dataset.pixelStore === 'ready') return;
    center.dataset.pixelStore = 'ready';
    center.innerHTML = '<h2>像素造型商店</h2><canvas id="char" width="160" height="220" aria-label="角色造型预览"></canvas><p id="wardrobeGold" aria-live="polite"></p><div class="wardrobeTabs" role="tablist" aria-label="服装类别"></div><div id="wardrobeItems" class="wardrobeItems"></div><p id="wardrobeMessage" class="note" aria-live="polite">购买后可随时更换已拥有的造型。</p><button class="btn" type="button" id="wardrobeBack">返回关卡</button>';
    const style = document.createElement('style');
    style.textContent = '#shop .center{justify-content:flex-start;padding:12px 12px 24px}#shop #char{width:105px;height:145px;image-rendering:pixelated;margin:2px auto}#wardrobeGold{color:#ffd84a;margin:4px}.wardrobeTabs{width:min(100%,560px);display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin:6px 0}.wardrobeTabs .btn{min-width:82px;padding:8px 10px;font-size:14px}.wardrobeTabs .btn.selected{border-color:#ffd84a;color:#ffd84a}.wardrobeItems{width:min(100%,560px);display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:4px 0 10px}.wardrobe-item{min-height:62px;border:1px solid #52677e;border-radius:10px;background:#1d2c3d;color:#fff;padding:9px;text-align:left;cursor:pointer}.wardrobe-item strong,.wardrobe-item span{display:block}.wardrobe-item span{margin-top:5px;color:#c7d4e4;font-size:13px}.wardrobe-item.equipped{border-color:#ffd84a;box-shadow:0 0 0 1px #ffd84a inset}.wardrobe-item:disabled{opacity:.55;cursor:not-allowed}#wardrobeMessage{min-height:22px;margin:4px}.wardrobeTabs .btn,#wardrobeBack,.wardrobe-item{touch-action:manipulation}@media(max-height:700px){#shop .center{padding-top:6px}#shop #char{width:80px;height:110px}.wardrobeTabs{margin:2px 0}.wardrobeItems{gap:5px}.wardrobe-item{min-height:54px;padding:7px}}';
    document.head.appendChild(style);
    let tab = 'hair';
    const tabs = center.querySelector('.wardrobeTabs');
    const list = center.querySelector('#wardrobeItems');
    const gold = center.querySelector('#wardrobeGold');
    const message = center.querySelector('#wardrobeMessage');
    CATEGORY_KEYS.forEach(key => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'btn'; button.dataset.category = key;
      button.textContent = CATEGORIES[key].label;
      button.setAttribute('role', 'tab');
      button.addEventListener('click', () => { tab = key; message.textContent = '购买后可随时更换已拥有的造型。'; refresh(); });
      tabs.appendChild(button);
    });
    function refresh() {
      const save = readSave();
      writeSave(save);
      gold.textContent = `🪙 金币：${save.gold || 0}`;
      tabs.querySelectorAll('[data-category]').forEach(button => {
        const selected = button.dataset.category === tab;
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-selected', String(selected));
      });
      list.replaceChildren();
      const category = CATEGORIES[tab];
      category.items.forEach((item, index) => {
        const owned = save.wardrobe[category.ownedKey].includes(index);
        const equipped = save.wardrobe[category.selectedKey] === index;
        const button = document.createElement('button');
        button.type = 'button'; button.className = `wardrobe-item${equipped ? ' equipped' : ''}`;
        const title = document.createElement('strong');
        title.textContent = `${item.name}${equipped ? ' · 已装备' : ''}`;
        const detail = document.createElement('span');
        detail.textContent = owned ? (equipped ? '当前造型' : '点击装备') : `购买价格：${item.price} 金币`;
        button.append(title, detail);
        button.disabled = !owned && (save.gold || 0) < item.price;
        button.addEventListener('click', () => {
          const latest = readSave();
          const wardrobe = latest.wardrobe;
          if (!wardrobe[category.ownedKey].includes(index)) {
            if ((latest.gold || 0) < item.price) {
              message.textContent = '金币不足！闯关收集更多金币后再来购买。';
              return;
            }
            latest.gold -= item.price;
            wardrobe[category.ownedKey].push(index);
            message.textContent = `已购买${item.name}！`;
          } else {
            message.textContent = `已装备${item.name}。`;
          }
          wardrobe[category.selectedKey] = index;
          if (tab === 'hair') latest.equip.hair = index % 3;
          if (tab === 'outfit') latest.equip.cloth = index % 3;
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
