'use strict';

(() => {
  const SAVE_KEY = 'pixel-adventure-save-v1';

  function preserveWardrobeOnSave() {
    if (typeof window.saveProgress !== 'function' || window.saveProgress.__wardrobeMerged) return;

    const originalSaveProgress = window.saveProgress;
    const wrappedSaveProgress = function (...args) {
      let stored;
      try { stored = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'); }
      catch (_) { stored = {}; }

      if (typeof save !== 'undefined' && save && stored.wardrobe) {
        save.wardrobe = stored.wardrobe;
      }
      return originalSaveProgress.apply(this, args);
    };

    wrappedSaveProgress.__wardrobeMerged = true;
    window.saveProgress = wrappedSaveProgress;
  }

  function getSave() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') || {}; }
    catch (_) { return {}; }
  }

  function createInventory() {
    if (document.querySelector('#inventoryOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'inventoryOverlay';
    overlay.className = 'screen';
    overlay.innerHTML = `
      <div class="inventoryPanel">
        <h2>🎒 背包</h2>
        <div id="inventoryGold">金币：0</div>
        <div id="inventoryItems" class="inventoryItems"></div>
        <button type="button" class="btn" id="inventoryClose">关闭背包</button>
      </div>`;

    const style = document.createElement('style');
    style.textContent = `
      #inventoryOverlay{position:fixed;inset:0;z-index:1000;display:none;align-items:center;justify-content:center;background:rgba(8,12,20,.82);padding:16px}
      #inventoryOverlay.active{display:flex}
      #inventoryOverlay .inventoryPanel{width:min(520px,100%);max-height:min(720px,90dvh);overflow:auto;border:1px solid #52677e;border-radius:14px;background:#182435;padding:18px;text-align:center}
      #inventoryGold{color:#ffd84a;margin:8px 0 14px;font-weight:700}
      #inventoryItems{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:12px}
      #inventoryItems .inventoryItem{min-height:72px;border:1px solid #52677e;border-radius:10px;background:#24364a;color:#fff;padding:10px;text-align:left}
      #inventoryItems strong,#inventoryItems span{display:block}
      #inventoryItems span{color:#c7d4e4;margin-top:5px;font-size:13px}
      @media(max-width:420px){#inventoryItems{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
    document.body.appendChild(overlay);

    overlay.querySelector('#inventoryClose').addEventListener('click', () => {
      overlay.classList.remove('active');
    });
    overlay.addEventListener('click', event => {
      if (event.target === overlay) overlay.classList.remove('active');
    });
  }

  function openInventory() {
    createInventory();
    const overlay = document.querySelector('#inventoryOverlay');
    if (!overlay) return;

    const saved = getSave();
    overlay.querySelector('#inventoryGold').textContent = `金币：${Number(saved.gold) || 0}`;

    const items = overlay.querySelector('#inventoryItems');
    items.replaceChildren();

    const list = [];
    list.push({ name: '金币', detail: `${Number(saved.gold) || 0} 枚` });
    list.push({ name: '当前关卡', detail: `第 ${Number(saved.currentLevel) || 1} 关` });

    const wardrobe = saved.wardrobe;
    if (wardrobe) {
      if (Number.isInteger(wardrobe.hair)) list.push({ name: '已装备发型', detail: `编号 ${wardrobe.hair}` });
      if (Number.isInteger(wardrobe.outfit)) list.push({ name: '已装备上衣', detail: `编号 ${wardrobe.outfit}` });
      if (Number.isInteger(wardrobe.skirt)) list.push({ name: '已装备裙子', detail: `编号 ${wardrobe.skirt}` });
      if (Number.isInteger(wardrobe.pants)) list.push({ name: '已装备裤子', detail: `编号 ${wardrobe.pants}` });
      if (Number.isInteger(wardrobe.shoes)) list.push({ name: '已装备鞋子', detail: `编号 ${wardrobe.shoes}` });
      if (Number.isInteger(wardrobe.accessory)) list.push({ name: '已装备饰品', detail: `编号 ${wardrobe.accessory}` });
    }

    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'inventoryItem';
      const name = document.createElement('strong');
      name.textContent = item.name;
      const detail = document.createElement('span');
      detail.textContent = item.detail;
      card.append(name, detail);
      items.appendChild(card);
    });

    overlay.classList.add('active');
  }

  function bindInventoryButtons() {
    createInventory();

    document.querySelectorAll('[data-open-inventory]').forEach(button => {
      if (button.dataset.inventoryBound === 'true') return;
      button.dataset.inventoryBound = 'true';
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        openInventory();
      });
    });

    const titleButtons = document.querySelectorAll('#title button');
    titleButtons.forEach(button => {
      if (/背包/.test(button.textContent || '') && button.dataset.inventoryBound !== 'true') {
        button.dataset.inventoryBound = 'true';
        button.addEventListener('click', event => {
          event.preventDefault();
          event.stopPropagation();
          openInventory();
        });
      }
    });

    window.openInventory = openInventory;
  }

  function boot() {
    preserveWardrobeOnSave();
    bindInventoryButtons();
    const title = document.querySelector('#title');
    if (title) {
      new MutationObserver(bindInventoryButtons).observe(title, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
