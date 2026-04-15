(function attachCoreClock(global) {
  'use strict';

  let serverSkewMs = 0;
  let headerClockTimerId = null;

  function updateFromSnapshot(snapshot) {
    if (!snapshot || !snapshot.serverNow) return;
    const serverNowMs = new Date(snapshot.serverNow).getTime();
    if (Number.isNaN(serverNowMs)) return;
    serverSkewMs = Date.now() - serverNowMs;
  }

  function getServerNowMs() {
    return Date.now() - serverSkewMs;
  }

  function getRemainingMs(endTime) {
    const endMs = new Date(endTime).getTime();
    if (Number.isNaN(endMs)) return 0;
    return Math.max(0, endMs - getServerNowMs());
  }

  function formatCountdownMs(remainingMs) {
    const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
    }
    return `${seconds}s`;
  }

  function getNextTickEndTime(snapshot) {
    if (!snapshot || !snapshot.letzteAktualisierung || !snapshot.tickDauerSekunden) return null;
    const tickDurationMs = Number(snapshot.tickDauerSekunden) * 1000;
    const lastUpdateMs = new Date(snapshot.letzteAktualisierung).getTime();
    if (!Number.isFinite(tickDurationMs) || Number.isNaN(lastUpdateMs) || tickDurationMs <= 0) return null;

    let nextTickMs = lastUpdateMs + tickDurationMs;
    const serverNowMs = getServerNowMs();
    while (nextTickMs <= serverNowMs) {
      nextTickMs += tickDurationMs;
    }
    return new Date(nextTickMs).toISOString();
  }

  function tickHeaderClock() {
    const clockEl = document.getElementById('headerTime');
    if (!clockEl) return;
    clockEl.textContent = new Date(getServerNowMs()).toLocaleTimeString('de-DE');
  }

  function startHeaderClock() {
    if (headerClockTimerId) return;
    tickHeaderClock();
    headerClockTimerId = setInterval(tickHeaderClock, 1000);
  }

  function stopHeaderClock() {
    if (!headerClockTimerId) return;
    clearInterval(headerClockTimerId);
    headerClockTimerId = null;
  }

  global.CoreClock = {
    updateFromSnapshot,
    getServerNowMs,
    getRemainingMs,
    formatCountdownMs,
    getNextTickEndTime,
    startHeaderClock,
    stopHeaderClock,
  };
}(window));
