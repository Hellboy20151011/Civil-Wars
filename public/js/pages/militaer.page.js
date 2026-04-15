(function initMilitaerPage(global) {
  'use strict';

  function onSnapshot(snapshot) {
    global.SharedRenderer.renderShared(snapshot);
  }

  function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;
    logoutBtn.addEventListener('click', async () => {
      await global.CoreApi.logout();
      global.location.href = '/login.html';
    });
  }

  global.MilitaerViewRenderer.init();
  global.LiveState.subscribe(onSnapshot);
  global.CountdownLoop.start(() => {
    global.LiveState.refreshNow();
  });
  global.LiveState.start();
  setupLogout();
}(window));
