const CACHE = 'pixel-adventure-v43';
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

    const playerBlock = /if\(invulnerable<=0\|\|Math\.floor\(performance\.now\(\)\/90\)%2===0\)\{[\s\S]*?ctx\.fillRect\(p\.x\+\(p\.vx<0\?5:15\),p\.y\+5,3,3\)\}/;
    html = html.replace(playerBlock, `if(invulnerable<=0||Math.floor(performance.now()/90)%2===0){if(window.drawEquippedPixelDetails)window.drawEquippedPixelDetails(ctx,p.x,p.y,save,p.vx,performance.now());else{ctx.fillStyle='#e9b786';ctx.fillRect(p.x+3,p.y,18,14);ctx.fillStyle=['#34251e','#a33','#fc3'][save.equip.hair];ctx.fillRect(p.x+2,p.y-2,20,7);ctx.fillStyle=['#fa0','#08f','#f3f'][save.equip.cloth];ctx.fillRect(p.x,p.y+14,p.w,18);ctx.fillStyle='#29364a';ctx.fillRect(p.x+2,p.y+32,8,4);ctx.fillRect(p.x+14,p.y+32,8,4);ctx.fillStyle='#17202c';ctx.fillRect(p.x+(p.vx<0?5:15),p.y+5,3,3)}}`);

    html = html.replace('</body>', `<script>
(() => {
  window.addEventListener('DOMContentLoaded', () => {
    if (typeof window.drawEquippedPixelDetails !== 'function') return;
    const drawEquipped = window.drawEquippedPixelDetails;
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 24;
    sampleCanvas.height = 40;
    const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
    const pixelColor = (x, y, fallback) => {
      try {
        const data = sampleCtx.getImageData(x, y, 1, 1).data;
        return data[3] ? 'rgb(' + data[0] + ',' + data[1] + ',' + data[2] + ')' : fallback;
      } catch (_) { return fallback; }
    };

    window.drawEquippedPixelDetails = (ctx, x, y, save, vx = 0, timestamp = 0) => {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      const walking = Math.abs(vx) > 0.1;
      sampleCtx.clearRect(0, 0, sampleCanvas.width, sampleCanvas.height);
      drawEquipped(sampleCtx, 0, 2, save);
      const skin = pixelColor(4, 12, '#e9b786');
      const shirt = pixelColor(12, 21, '#fa0');

      if (!walking) {
        drawEquipped(ctx, x, y, save);
        ctx.save();
        ctx.fillStyle = '#704832';
        ctx.fillRect(x + 1, y + 16, 1, 7);
        ctx.fillRect(x + 22, y + 16, 1, 7);
        ctx.fillStyle = shirt;
        ctx.fillRect(x + 2, y + 16, 3, 7);
        ctx.fillRect(x + 19, y + 16, 3, 7);
        ctx.fillStyle = skin;
        ctx.fillRect(x + 2, y + 23, 3, 3);
        ctx.fillRect(x + 19, y + 23, 3, 3);
        ctx.restore();
        return;
      }

      const hair = pixelColor(8, 3, '#34251e');
      const pants = pixelColor(5, 30, '#29364a');
      const shoe = pixelColor(5, 35, '#493425');
      const phase = Math.floor(timestamp / 110) % 2;
      const facingLeft = vx < 0;
      ctx.save();
      ctx.translate(x + (facingLeft ? 24 : 0), y);
      ctx.scale(facingLeft ? -1 : 1, 1);
      const part = (localX, localY, width, height) => ctx.fillRect(localX, localY, width, height);

      // Side-facing hair frames the head; leave the central face in skin tone.
      ctx.fillStyle = skin;
      part(7, 2, 11, 10);
      part(10, 11, 7, 2);
      ctx.fillStyle = hair;
      part(7, 0, 11, 3);
      part(5, 2, 5, 5);
      part(5, 6, 3, 7);
      part(13, 3, 5, 2);
      // A brimmed hat sits above the face, like the supplied reference.
      ctx.fillStyle = '#211f23';
      part(6, -4, 12, 4);
      part(3, 0, 19, 2);
      part(0, 2, 24, 2);
      // Repaint the visible cheek, nose, chin and eye after the hair/hat layers.
      ctx.fillStyle = skin;
      part(10, 4, 7, 3);
      part(8, 7, 10, 3);
      part(10, 10, 7, 3);
      part(18, 7, 3, 3);
      ctx.fillStyle = '#fff1c9';
      part(14, 6, 2, 2);
      ctx.fillStyle = '#222';
      part(15, 6, 1, 2);
      ctx.fillStyle = '#9b5b4b';
      part(17, 11, 2, 1);

      ctx.fillStyle = shirt;
      part(8, 13, 10, 13);
      part(7, phase ? 18 : 14, 3, 7);
      part(14, phase ? 14 : 18, 4, 7);
      ctx.fillStyle = skin;
      part(14, phase ? 20 : 24, 3, 3);
      part(7, phase ? 24 : 20, 3, 3);
      ctx.fillStyle = pants;
      part(8, 25 + (phase ? 2 : 0), 5, 7 - (phase ? 2 : 0));
      part(13, 25 + (phase ? 0 : 2), 5, 7 - (phase ? 0 : 2));
      ctx.fillStyle = shoe;
      part(7 + (phase ? 2 : 0), 32, 7, 4);
      part(12 - (phase ? 2 : 0), 32, 7, 4);
      ctx.restore();
    };
  }, { once: true });

  const home = document.querySelector('#title .center');
  if (home) {
    let shopButton = [...home.querySelectorAll('button')].find(button => /go\\(['"]shop['"]\\)/.test(button.getAttribute('onclick') || ''));
    if (!shopButton) {
      shopButton = document.createElement('button');
      shopButton.type = 'button'; shopButton.className = 'btn';
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
      inventoryButton.type = 'button'; inventoryButton.className = 'btn';
      inventoryButton.dataset.openInventory = 'true'; inventoryButton.textContent = '🎒 背包';
      inventoryButton.setAttribute('aria-label', '打开背包');
      inventoryButton.addEventListener('click', () => window.openInventory ? window.openInventory() : document.querySelector('.inventory-open')?.click());
      shopButton.insertAdjacentElement('afterend', inventoryButton);
    }
  }

  const map = document.querySelector('#map .center');
  if (map && !map.querySelector('[data-return-home]')) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'btn';
    button.dataset.returnHome = 'true'; button.textContent = '返回主页';
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
