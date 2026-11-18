const CACHE = 'pixel-adventure-v32';
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
    html = html.replace(/ctx\.fillRect\(p\.x\+\(p\.vx<0\?5:15\),p\.y\+5,3,3\)/, match => `${match};if(window.drawEquippedPixelDetails)window.drawEquippedPixelDetails(ctx,p.x,p.y,save,p.vx,performance.now(),cameraX)`);

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
      // Treat even slow movement as walking; return to the equipped idle pose
      // as soon as the player's velocity has nearly settled.
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

      // Repaint as a side-facing profile while moving; alternate arm/leg poses
      // at a fixed cadence so animation speed does not depend on frame rate.
      drawEquipped(ctx, x, y, save);
      const sx = x - cameraX;
      const skin = pixelColor(ctx, sx + 4, y + 10, '#e9b786');
      const hair = pixelColor(ctx, sx + 8, y + 1, '#34251e');
      const shirt = pixelColor(ctx, sx + 12, y + 19, '#fa0');
      const pants = pixelColor(ctx, sx + 5, y + 28, '#29364a');
      const shoe = pixelColor(ctx, sx + 5, y + 33, '#493425');
      const facing = vx < 0 ? -1 : 1;
      const phase = Math.floor(timestamp / 110) % 2;
      ctx.save();
      ctx.fillStyle = skin;
      ctx.fillRect(x + 2, y, 20, 14);
      ctx.fillStyle = hair;
      ctx.fillRect(x + 3, y, 17, 4);
      ctx.fillRect(x + (facing > 0 ? 2 : 18), y + 2, 4, 8);
      ctx.fillStyle = skin;
      ctx.fillRect(x + (facing > 0 ? 15 : 6), y + 5, 6, 8);
      ctx.fillStyle = '#222';
      ctx.fillRect(x + (facing > 0 ? 18 : 6), y + 6, 2, 2);
      ctx.fillStyle = shirt;
      ctx.fillRect(x + 5, y + 14, 14, 12);
      const armSwing = phase ? 3 : 0;
      ctx.fillRect(x + (facing > 0 ? 15 : 6), y + 17 + armSwing, 4, 7);
      ctx.fillStyle = skin;
      ctx.fillRect(x + (facing > 0 ? 15 : 6), y + 23 + armSwing, 4, 3);
      ctx.fillStyle = pants;
      ctx.fillRect(x + 6, y + 25, 5, 8 - (phase ? 2 : 0));
      ctx.fillRect(x + 13, y + 25 + (phase ? 2 : 0), 5, 8 - (phase ? 0 : 2));
      ctx.fillStyle = shoe;
      ctx.fillRect(x + 5 + (phase ? 2 : 0), y + 32, 7, 4);
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
