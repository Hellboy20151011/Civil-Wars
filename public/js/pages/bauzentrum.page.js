(function initBauzentrumPage(global) {
  'use strict';

  let refreshScheduled = false;

  function onSnapshot(snapshot) {
    global.SharedRenderer.renderShared(snapshot);
    global.BauzentrumViewRenderer.render(snapshot);
  }

  function onCountdownFinished() {
    if (refreshScheduled) return;
    refreshScheduled = true;
    setTimeout(async () => {
      refreshScheduled = false;
      await global.LiveState.refreshNow();
    }, 250);
  }

  function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;
    logoutBtn.addEventListener('click', async () => {
      await global.CoreApi.logout();
      global.location.href = '/login.html';
    });
  }

  global.BauzentrumViewRenderer.init();
  global.LiveState.subscribe(onSnapshot);
  global.CountdownLoop.start(onCountdownFinished);
  global.LiveState.start();
  setupLogout();
}(window));
