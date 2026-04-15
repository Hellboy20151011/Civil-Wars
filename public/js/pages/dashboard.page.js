(function initDashboardPage(global) {
  'use strict';

  let isRefreshPending = false;

  function onSnapshot(snapshot) {
    global.SharedRenderer.renderShared(snapshot);
    global.DashboardViewRenderer.renderDashboardView(snapshot);
  }

  function onCountdownFinished() {
    if (isRefreshPending) return;
    isRefreshPending = true;
    setTimeout(async () => {
      isRefreshPending = false;
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

  global.LiveState.subscribe(onSnapshot);
  global.CountdownLoop.start(onCountdownFinished);
  global.LiveState.start();
  setupLogout();
}(window));
