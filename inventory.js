'use strict';

(() => {
  const SAVE_KEY = 'pixel-adventure-save-v1';

  // Preserve the wardrobe written by customization.js when the game saves its
  // own progress, without replacing newer game state such as level rewards.
  function preserveWardrobeOnSave() {
    if (typeof window.saveProgress !== 'function' || window.saveProgress.__wardrobeMerged) return;

    const originalSaveProgress = window.saveProgress;
    const wrappedSaveProgress = function (...args) {
      let stored;
      try {
        stored = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
      } catch (_) {
        stored = {};
      }

      if (typeof save !== 'undefined' && save && stored.wardrobe) {
        save.wardrobe = stored.wardrobe;
      }
      return originalSaveProgress.apply(this, args);
    };

    wrappedSaveProgress.__wardrobeMerged = true;
    window.saveProgress = wrappedSaveProgress;
  }

  function boot() {
    preserveWardrobeOnSave();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
