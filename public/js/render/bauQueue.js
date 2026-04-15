(function attachBauQueueRenderer(global) {
  'use strict';

  function renderIntoContainer(container, html, fallbackText) {
    if (!container) return;
    container.innerHTML = html || `<span class="empty-state">${fallbackText}</span>`;
  }

  function renderBauQueue(auftraege) {
    const queueContainer = document.getElementById('bauWarteschlange');
    const auftragContainer = document.getElementById('auftragBauContent');

    if (!queueContainer && !auftragContainer) return;

    if (!Array.isArray(auftraege) || auftraege.length === 0) {
      renderIntoContainer(queueContainer, '', 'Keine Gebäude in der Bauwarteschlange.');
      renderIntoContainer(auftragContainer, '', '- Kein Auftrag vorhanden -');
      return;
    }

    const queueHtml = auftraege.map((auftrag) => `
      <div class="gebaeude-item bau-queue-item">
        <span class="gebaeude-name">${escapeHtml(auftrag.gebaeude_name)}</span>
        <span class="gebaeude-info">&times; ${escapeHtml(String(auftrag.anzahl))}</span>
        <span
          class="bau-queue-countdown"
          data-endtime="${escapeHtml(auftrag.fertig_am)}"
          data-prefix="⏳ "
          data-done-text="✅ Fertig!"
        >⏳ --</span>
      </div>
    `).join('');

    if (queueContainer) queueContainer.innerHTML = queueHtml;
    if (auftragContainer) auftragContainer.innerHTML = queueHtml;
    global.CountdownLoop.refresh();
  }

  global.BauQueueRenderer = { renderBauQueue };
}(window));
