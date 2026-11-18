const CACHE = 'pixel-adventure-v34';
const FILES = ['./', './index.html', './manifest.json', './customization.js', './inventory.js'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('pixel-adventure-') && key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    const response = cached || await fetch(request);
    const url = new URL(request.url);
    const isPage = /(^|\/)index\.html$/.test(url.pathname) || /\/pixel-adventure\/?$/.test(url.pathname);
    if (url.origin !== self.location.origin || !isPage) return response;

    let html = await response.text();
    if (!html.includes('customization.js')) {
      html = html.replace('</body>', '<script src="./customization.js" defer></script></body>');
    }
    if (!html.includes('inventory.js')) {
      html = html.replace('</body>', '<script src="./inventory.js" defer></script></body>');
    }
    html = html.replace(/function drawChar\(\)\{[\s\S]*?\}\s*function updateShop\(/, 'function drawChar(){if(window.renderPixelShopAvatar)window.renderPixelShopAvatar()}\nfunction updateShop(');

    // Replace the entire built-in player sprite at its draw site. Calling the
    // side-view renderer after the original sprite left the back-facing pixels
    // visible underneath it, which made the character still look back-facing.
    const playerBlock = /if\(invulnerable<=0\|\|Math\.floor\(performance\.now\(\)\/90\)%2===0\)\{[\s\S]*?ctx\.fillRect\(p\.x\+\(p\.vx<0\?5:15\),p\.y\+5,3,3\)\}/;
    html = html.replace(playerBlock, `if(invulnerable<=0||Math.floor(performance.now()/90)%2===0){if(window.drawEquippedPixelDetails)window.drawEquippedPixelDetails(ctx,p.x,p.y,save,p.vx,performance.now(),cameraX);else{ctx.fillStyle='#e9b786';ctx.fillRect(p.x+3,p.y,18,14);ctx.fillStyle=['#34251e','#a33','#fc3'][save.equip.hair];ctx.fillRect(p.x+2,p.y-2,20,7);ctx.fillStyle=['#fa0','#08f','#f3f'][save.equip.cloth];ctx.fillRect(p.x,p.y+14,p.w,18);ctx.fillStyle='#29364a';ctx.fillRect(p.x+2,p.y+32,8,4);ctx.fillRect(p.x+14,p.y+32,8,4);ctx.fillStyle='#17202c';ctx.fillRect(p.x+(p.vx<0?5:15),p.y+5,3,3)}}`);

    html = html.replace('</body>', `<script>
(() => {
  // customization.js is deferred, so install the animation hook after it has loaded.
  window.addEventListener('DOMContentLoaded', () => {
    if (typeof window.drawEquippedPixelDetails !== 'function') return;
    const drawEquipped = window.drawEquippedPixelDetails;
    const pixelColor = (ctx, x, y, fallback) => {
      try {
        const data = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
        return data[3] ? 'rgb(' + data[0] + ',' + data[1] + ',' + data[2] + ')' : fallback;
      } catch (_) { return fallback; }
    };

    window.drawEquippedPixelDetails = (ctx, x, y, save, vx = 0, timestamp = 0, cameraX = 0) => {
      const walking = Math.abs(vx) > 0.1;
      if (!walking) {
        drawEquipped(ctx, x, y, save);
        const sx = x - cameraX;
        const sleeve = pixelColor(ctx, sx + 12, y + 19, '#fa0');
        const skin = pixelColor(ctx, sx + 4, y + 10, '#e9b786');
        ctx.save();
        ctx.fillStyle = sleeve;
        ctx.fillRect(x + 1, y + 16, 3, 7);
        ctx.fillRect(x + 20, y + 16, 3, 7);
        ctx.fillStyle = skin;
        ctx.fillRect(x + 1, y + 22, 3, 3);
        ctx.fillRect(x + 20, y + 22, 3, 3);
        ctx.restore();
        return;
      }

      // Capture the clean scene before drawing the equipped sprite so it can
      // be removed completely before drawing the side-facing animation.
      const sx = Math.round(x - cameraX);
      const sy = Math.round(y);
      let background = null;
      try { background = ctx.getImageData(sx, sy, 24, 36); } catch (_) {}
      drawEquipped(ctx, x, y, save);
      const skin = pixelColor(ctx, sx + 4, sy + 10, '#e9b786');
      const hair = pixelColor(ctx, sx + 8, sy + 1, '#34251e');
      const shirt = pixelColor(ctx, sx + 12, sy + 19, '#fa0');
      const pants = pixelColor(ctx, sx + 5, sy + 28, '#29364a');
      const shoe = pixelColor(ctx, sx + 5, sy + 33, '#493425');
      if (background) ctx.putImageData(background, sx, sy);

      const phase = Math.floor(timestamp / 110) % 2;
      ctx.save();
      if (vx < 0) {
        ctx.translate(x + 24, 0);
        ctx.scale(-1, 1);
      }

      // Narrow side profile: the single eye and nose face the travel direction.
      ctx.fillStyle = skin;
      ctx.fillRect(x + 7, y + 1, 11, 12);
      ctx.fillStyle = hair;
      ctx.fillRect(x + 6, y, 12, 4);
      ctx.fillRect(x + 6, y + 2, 4, 10);
      ctx.fillRect(x + 15, y + 2, 3, 3);
      ctx.fillStyle = skin;
      ctx.fillRect(x + 17, y + 7, 3, 3);
      ctx.fillStyle = '#222';
      ctx.fillRect(x + 15, y + 5, 2, 2);

      // Torso, with both visible arms swinging in opposition while walking.
      ctx.fillStyle = shirt;
      ctx.fillRect(x + 8, y + 13, 10, 13);
      ctx.fillStyle = shirt;
      ctx.fillRect(x + 7, y + (phase ? 18 : 14), 3, 7);
      ctx.fillRect(x + 14, y + (phase ? 14 : 18), 4, 7);
      ctx.fillStyle = skin;
      ctx.fillRect(x + 14, y + (phase ? 20 : 24), 3, 3);
      ctx.fillRect(x + 7, y + (phase ? 24 : 20), 3, 3);

      // Alternating legs and feet follow the arm swing.
      ctx.fillStyle = pants;
      ctx.fillRect(x + 8, y + 25 + (phase ? 2 : 0), 5, 7 - (phase ? 2 : 0));
      ctx.fillRect(x + 13, y + 25 + (phase ? 0 : 2), 5, 7 - (phase ? 0 : 2));
      ctx.fillStyle = shoe;
      ctx.fillRect(x + 7 + (phase ? 2 : 0), y + 32, 7, 4);
      ctx.fillRect(x + 12 - (phase ? 2 : 0), y + 32, 7, 4);
      ctx.restore();
    };
  }, { once: true });

  const home = document.querySelector('#title .center');
  if (home) {
    let shopButton = [...home.querySelectorAll('button')].find(button => /go\\(['"]shop['"]\\)/.test(button.getAttribute('onclick') || ''));
    if (!shopButton) {
      shopButton = document.createElement('button');
      shopButton.type = 'button';
      shopButton.className = 'btn';
      shopButton.addEventListener('click', () => window.go('shop'));
      home.appendChild(shopButton);
    }
    shopButton.textContent = '🛍️ 商店';
    shopButton.setAttribute('aria-label', '打开商店');

    if (!home.querySelector('[data-open-inventory]')) {
      const inventoryStyle = document.createElement('style');
      inventoryStyle.textContent = '#title.active ~ .inventory-open{display:none!important}';
      document.head.appendChild(inventoryStyle);
      const inventoryButton = document.createElement('button');
      inventoryButton.type = 'button';
      inventoryButton.className = 'btn';
      inventoryButton.dataset.openInventory = 'true';
      inventoryButton.textContent = '🎒 背包';
      inventoryButton.setAttribute('aria-label', '打开背包');
      inventoryButton.addEventListener('click', () => document.querySelector('.inventory-open')?.click());
      shopButton.insertAdjacentElement('afterend', inventoryButton);
    }
  }

  const map = document.querySelector('#map .center');
  if (map && !map.querySelector('[data-return-home]')) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn';
    button.dataset.returnHome = 'true';
    button.textContent = '返回主页';
    button.setAttribute('aria-label', '返回主页');
    button.addEventListener('click', () => window.go('title'));
    map.appendChild(button);
  }
})();
</script></body>`);

    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers)
    });
  })());
});
