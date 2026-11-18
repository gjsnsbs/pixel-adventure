'use strict';

(() => {
  const SAVE_KEY = 'pixel-adventure-save-v1';
  let previousScreen = 'title';
  let currentCategory = 'hair';

  function readSavedGame() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'); } catch (_) { return {}; }
  }

  // Keep the wardrobe and the main game's save state in sync without allowing
  // an old stored gold value to overwrite a newly completed level reward.
  function preserveWardrobeOnSave() {
    if (typeof window.saveProgress !== 'function' || window.saveProgress.__wardrobeMerged) return;
    const saveProgress = window.saveProgress;
    const wrapped = function (...args) {
      const stored = readSavedGame();
      if (typeof save === 'object' && save) {
        if (stored.wardrobe) save.wardrobe = stored.wardrobe;
        if (save.wardrobe && !save.wardrobe.equip) save.wardrobe = stored.wardrobe;
      }
      return saveProgress.apply(this, args);
    };
    wrapped.__wardrobeMerged = true;
    window.saveProgress = wrapped;
  }

  function installStyles() {
