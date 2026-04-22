(function attachLiveState(global) {
  'use strict';

  const POLL_INTERVAL_MS = 5000;

  let intervalId = null;
  let latestSnapshot = null;
  let currentRequestToken = 0;
  let latestAppliedToken = 0;
  const subscribers = new Set();

  function notify(snapshot) {
    subscribers.forEach((callback) => {
      try {
        callback(snapshot);
      } catch (error) {
        console.error('LiveState-Subscriber Fehler:', error);
      }
    });
  }

  async function refreshNow() {
    const requestToken = ++currentRequestToken;

    try {
      const snapshot = await global.CoreApi.getMe();
      if (!snapshot) return null;

      if (requestToken < latestAppliedToken) {
        return latestSnapshot;
      }

      latestAppliedToken = requestToken;
      latestSnapshot = snapshot;
      global.CoreClock.updateFromSnapshot(snapshot);
      notify(snapshot);
      return snapshot;
    } catch (error) {
      console.error('LiveState refresh fehlgeschlagen:', error);
      return latestSnapshot;
    }
  }

  function start() {
    if (intervalId) return;
    refreshNow();
    intervalId = setInterval(refreshNow, POLL_INTERVAL_MS);
  }

  function stop() {
    if (!intervalId) return;
    clearInterval(intervalId);
    intervalId = null;
  }

  function subscribe(callback) {
    if (typeof callback !== 'function') {
      return function noop() {};
    }

    subscribers.add(callback);

    if (latestSnapshot) {
      // Fehler im initialen Callback dürfen den Aufrufer nicht unterbrechen.
      try {
        callback(latestSnapshot);
      } catch (error) {
        console.error('LiveState-Subscriber Fehler (initial):', error);
      }
    }

    return function unsubscribe() {
      subscribers.delete(callback);
    };
  }

  function getSnapshot() {
    return latestSnapshot;
  }

  global.LiveState = {
    start,
    stop,
    refreshNow,
    subscribe,
    getSnapshot,
  };
}(window));
