(function attachDashboardViewRenderer(global) {
  'use strict';

  function renderGebaeudeListe(gebaeude) {
    const container = document.getElementById('meineGebaeudeListe');
    if (!container) return;

    if (!Array.isArray(gebaeude) || gebaeude.length === 0) {
      container.innerHTML = '<span class="empty-state">- Noch keine Gebäude gebaut! -</span>';
      return;
    }

    container.innerHTML = gebaeude.map((building) => `
      <div class="gebaeude-item">
        <span class="gebaeude-name">${escapeHtml(building.name)}</span>
        <span class="gebaeude-info">(${escapeHtml(building.kategorie)}) &times; ${escapeHtml(String(building.anzahl))}</span>
        <span class="gebaeude-strom">⚡ +${escapeHtml(String(building.strom_produktion))} / -${escapeHtml(String(building.strom_verbrauch))}</span>
      </div>
    `).join('');
  }

  function renderDashboardView(snapshot) {
    if (!snapshot) return;
    renderGebaeudeListe(snapshot.gebaeude || []);
    global.BauQueueRenderer.renderBauQueue(snapshot.bauauftraege || []);
  }

  global.DashboardViewRenderer = { renderDashboardView };
}(window));
