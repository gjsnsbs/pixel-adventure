'use strict';

(() => {
  const SAVE_KEY = 'pixel-adventure-save-v1';
  let previousScreen = 'title';
  let currentCategory = 'hair';

  function readSavedGame() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'); } catch (_) { return {}; }
  }

  // Keep the main game save and the wardrobe written by customization.js in sync.
  // The shop writes its latest save before calling saveProgress; merge that state
  // into the game's save object so a purchase/equip is not overwritten.
  function preserveWardrobeOnSave() {
    if (typeof window.saveProgress !== 'function' || window.saveProgress.__wardrobeMerged) return;
    const saveProgress = window.saveProgress;
    const wrapped = function (...args) {
      const stored = readSavedGame();
      if (typeof save === 'object' && save) {
        if (stored.wardrobe) save.wardrobe = stored.wardrobe;
        if (Number.isFinite(stored.gold)) save.gold = stored.gold;
      }
      return saveProgress.apply(this, args);
    };
    wrapped.__wardrobeMerged = true;
    window.saveProgress = wrapped;
  }

  function installStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #inventory{position:fixed;inset:0;z-index:1000;background:linear-gradient(145deg,#101522,#1b2940);padding:clamp(8px,2vw,22px);}
      #inventory.active{display:flex;align-items:stretch;justify-content:center;}
      .inventory-frame{position:relative;display:flex;gap:clamp(10px,2vw,24px);width:min(1100px,100%);height:100%;min-height:0;margin:auto;padding:clamp(12px,2vw,24px);border:2px solid #52677e;border-radius:18px;background:rgba(13,20,32,.92);box-shadow:0 12px 40px #0008;}
      .inventory-preview{flex:0 0 36%;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid #384b63;border-radius:14px;background:radial-gradient(ellipse at center,#32445c,#172233 72%);text-align:center;}
      .inventory-preview h2{margin:0 0 8px;font-size:clamp(18px,3vw,28px);}
      #inventoryAvatar{width:min(72%,240px);height:min(68%,360px);min-height:160px;image-rendering:pixelated;background:#111a;border-radius:12px;}
      #inventoryGold{margin:8px 0 0;color:#ffd84a;font-weight:700;}
      .inventory-closet{flex:1;min-width:0;display:flex;flex-direction:column;}
      .inventory-heading{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;}
      .inventory-heading h2{margin:0;font-size:clamp(18px,3vw,26px);}
      #inventoryClose{flex:0 0 auto;width:42px;height:42px;border:1px solid #70849b;border-radius:12px;background:#24364b;color:white;font-size:23px;cursor:pointer;}
      .inventory-tabs{display:flex;gap:6px;overflow-x:auto;padding:2px 1px 9px;scrollbar-width:thin;}
      .inventory-tab{flex:0 0 auto;border:1px solid #52677e;border-radius:10px;background:#1d2c3d;color:#fff;padding:8px 11px;font:inherit;cursor:pointer;}
      .inventory-tab.selected{border-color:#ffd84a;color:#ffd84a;box-shadow:0 0 0 1px #ffd84a inset;}
      #inventoryItems{flex:1;min-height:0;overflow:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(min(150px,45%),1fr));align-content:start;gap:8px;padding:2px 4px 8px 1px;}
      .inventory-item{min-height:64px;border:1px solid #52677e;border-radius:10px;background:#1d2c3d;color:#fff;padding:9px;text-align:left;cursor:pointer;}
      .inventory-item strong,.inventory-item span{display:block;}
      .inventory-item span{margin-top:5px;color:#c7d4e4;font-size:13px;}
      .inventory-item.equipped{border-color:#ffd84a;box-shadow:0 0 0 1px #ffd84a inset;}
      #inventoryMessage{min-height:20px;margin:6px 0 0;color:#c7d4e4;font-size:14px;}
      .inventory-open{position:fixed;z-index:900;top:max(10px,env(safe-area-inset-top));right:max(10px,env(safe-area-inset-right));width:46px;height:46px;display:none;align-items:center;justify-content:center;border:1px solid #fff8;border-radius:14px;background:#172235eF;color:#fff;font-size:25px;line-height:1;box-shadow:0 3px 12px #0007;cursor:pointer;touch-action:manipulation;}
      .inventory-open.visible{display:flex;}
      @media(max-width:520px){.inventory-frame{gap:8px;padding:8px}.inventory-preview{flex-basis:34%}.inventory-preview h2{font-size:16px}#inventoryAvatar{width:90%;height:min(58%,280px);min-height:130px}.inventory-tab{padding:7px 9px;font-size:13px}#inventoryItems{grid-template-columns:1fr;gap:6px}.inventory-item{min-height:54px;padding:7px}.inventory-item span{font-size:12px}}
    `;
    document.head.appendChild(style);
  }

  function makeInventoryScreen() {
    const screen = document.createElement('section');
    screen.id = 'inventory';
    screen.className = 'screen';
    screen.setAttribute('aria-label', '背包');
    screen.innerHTML = `
      <div class="inventory-frame">
        <section class="inventory-preview" aria-label="角色穿戴效果">
          <h2>穿戴效果</h2>
          <canvas id="inventoryAvatar" width="240" height="360" aria-label="当前角色造型"></canvas>
          <p id="inventoryGold" aria-live="polite"></p>
        </section>
        <section class="inventory-closet" aria-label="背包物品">
          <div class="inventory-heading"><h2>🎒 我的背包</h2><button id="inventoryClose" type="button" aria-label="关闭背包">×</button></div>
          <div class="inventory-tabs" role="tablist" aria-label="物品类别"></div>
          <div id="inventoryItems" aria-live="polite"></div>
          <p id="inventoryMessage" aria-live="polite">选择已拥有的服饰即可立即穿戴。</p>
        </section>
      </div>`;
    document.body.appendChild(screen);

    const openButton = document.createElement('button');
    openButton.type = 'button';
    openButton.className = 'inventory-open';
    openButton.setAttribute('aria-label', '打开背包');
    openButton.title = '背包';
    openButton.textContent = '🎒';
    document.body.appendChild(openButton);
    return { screen, openButton };
  }

  function refreshOpenButton(openButton) {
    const visible = document.querySelector('#title.active, #play.active');
    openButton.classList.toggle('visible', Boolean(visible));
  }

  function drawPreview() {
    const canvas = document.getElementById('inventoryAvatar');
    if (!canvas || typeof window.drawEquippedPixelDetails !== 'function') return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const scale = Math.min(canvas.width / 34, canvas.height / 46);
    ctx.save();
    ctx.translate((canvas.width - 24 * scale) / 2, (canvas.height - 36 * scale) / 2 + 5);
    ctx.scale(scale, scale);
    window.drawEquippedPixelDetails(ctx, 0, 0, readSavedGame());
    ctx.restore();
    const gold = document.getElementById('inventoryGold');
    if (gold) gold.textContent = `🪙 金币：${readSavedGame().gold || 0}`;
  }

  function shopControls() {
    const shop = document.getElementById('shop');
    return shop && shop.querySelector('.center');
  }

  function refreshItems() {
    const center = shopControls();
    const tabs = center && center.querySelector('.wardrobeTabs');
    const sourceList = center && center.querySelector('#wardrobeItems');
    const inventoryTabs = document.querySelector('#inventory .inventory-tabs');
    const items = document.getElementById('inventoryItems');
    if (!tabs || !sourceList || !inventoryTabs || !items) return;

    inventoryTabs.replaceChildren();
    const categoryButtons = [...tabs.querySelectorAll('[data-category]')];
    categoryButtons.forEach(tab => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `inventory-tab${tab.dataset.category === currentCategory ? ' selected' : ''}`;
      button.textContent = tab.textContent;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', String(tab.dataset.category === currentCategory));
      button.addEventListener('click', () => {
        currentCategory = tab.dataset.category;
        refreshItems();
      });
      inventoryTabs.appendChild(button);
    });

    const activeTab = categoryButtons.find(tab => tab.dataset.category === currentCategory) || categoryButtons[0];
    if (!activeTab) return;
    currentCategory = activeTab.dataset.category;
    activeTab.click();
    items.replaceChildren();
    [...sourceList.querySelectorAll('.wardrobe-item')].forEach((source, index) => {
      const detail = source.querySelector('span')?.textContent || '';
      const owned = detail.includes('当前造型') || detail.includes('点击装备');
      if (!owned) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `inventory-item${source.classList.contains('equipped') ? ' equipped' : ''}`;
      const title = document.createElement('strong');
      title.textContent = source.querySelector('strong')?.textContent || '服饰';
      const status = document.createElement('span');
      status.textContent = detail;
      button.append(title, status);
      button.addEventListener('click', () => {
        const latestTab = [...tabs.querySelectorAll('[data-category]')].find(item => item.dataset.category === currentCategory);
        latestTab?.click();
        const sourceItem = sourceList.querySelectorAll('.wardrobe-item')[index];
        sourceItem?.click();
        document.getElementById('inventoryMessage').textContent = `已穿戴${title.textContent.replace(' · 已装备', '')}。`;
        drawPreview();
        refreshItems();
      });
      items.appendChild(button);
    });
    if (!items.childElementCount) {
      const empty = document.createElement('p');
      empty.className = 'note';
      empty.textContent = '这个分类还没有物品，去商店看看吧。';
      items.appendChild(empty);
    }
    drawPreview();
  }

  function boot() {
    preserveWardrobeOnSave();
    installStyles();
    const { screen, openButton } = makeInventoryScreen();
    const closeButton = screen.querySelector('#inventoryClose');

    function openInventory() {
      const active = document.querySelector('.screen.active');
      previousScreen = active && active.id !== 'inventory' ? active.id : 'title';
      if (previousScreen === 'play' && typeof gameActive !== 'undefined') gameActive = false;
      document.querySelectorAll('.screen').forEach(item => item.classList.remove('active'));
      screen.classList.add('active');
      openButton.classList.remove('visible');
      refreshItems();
      closeButton.focus();
    }

    function closeInventory() {
      screen.classList.remove('active');
      const destination = document.getElementById(previousScreen) || document.getElementById('title');
      destination.classList.add('active');
      refreshOpenButton(openButton);
      if (previousScreen === 'play' && typeof gameActive !== 'undefined' && typeof gameLoop === 'function') {
        gameActive = true;
        lastFrame = 0;
        requestAnimationFrame(gameLoop);
      }
      openButton.focus();
    }

    openButton.addEventListener('click', openInventory);
    closeButton.addEventListener('click', closeInventory);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && screen.classList.contains('active')) closeInventory();
    });
    new MutationObserver(() => refreshOpenButton(openButton)).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
    refreshOpenButton(openButton);
    drawPreview();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
