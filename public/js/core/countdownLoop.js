(function attachCountdownLoop(global) {
  'use strict';

  let intervalId = null;
  let onCountdownFinished = null;
  const finishedElements = new WeakSet();

  function updateCountdownElements() {
    const countdownElements = document.querySelectorAll('[data-endtime]');
    let anyFinishedNow = false;

    countdownElements.forEach((element) => {
      const endTime = element.getAttribute('data-endtime');
      if (!endTime) return;

      const remainingMs = global.CoreClock.getRemainingMs(endTime);
      if (remainingMs <= 0) {
        const doneText = element.getAttribute('data-done-text') || '✅ Fertig!';
        if (element.textContent !== doneText) {
          element.textContent = doneText;
        }

        if (!finishedElements.has(element)) {
          finishedElements.add(element);
          anyFinishedNow = true;
        }
        return;
      }

      const prefix = element.getAttribute('data-prefix') || '';
      const nextText = `${prefix}${global.CoreClock.formatCountdownMs(remainingMs)}`;
      if (element.textContent !== nextText) {
        element.textContent = nextText;
      }
      if (finishedElements.has(element)) {
        finishedElements.delete(element);
      }
    });

    if (anyFinishedNow && typeof onCountdownFinished === 'function') {
      onCountdownFinished();
    }
  }

  function setOnCountdownFinished(callback) {
    onCountdownFinished = typeof callback === 'function' ? callback : null;
  }

  function start(callback) {
    if (callback) {
      setOnCountdownFinished(callback);
    }
    if (intervalId) return;
    updateCountdownElements();
    intervalId = setInterval(updateCountdownElements, 1000);
  }

  function stop() {
    if (!intervalId) return;
    clearInterval(intervalId);
    intervalId = null;
  }

  function refresh() {
    updateCountdownElements();
  }

  global.CountdownLoop = {
    start,
    stop,
    refresh,
    setOnCountdownFinished,
  };
}(window));
