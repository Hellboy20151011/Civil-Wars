(function attachCoreApi(global) {
  'use strict';

  async function readJson(response) {
    try {
      return await response.json();
    } catch (error) {
      return null;
    }
  }

  async function getRequest(url) {
    const response = await fetch(url);
    const data = await readJson(response);
    return { response, data };
  }

  async function postRequest(url, payload) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
    });
    const data = await readJson(response);
    return { response, data };
  }

  async function getMe() {
    const { response, data } = await getRequest('/api/me');
    if (!response.ok) {
      global.location.href = '/login.html';
      return null;
    }
    return data;
  }

  async function getBuildingTypes() {
    const { response, data } = await getRequest('/api/buildings/types');
    if (!response.ok) {
      throw new Error((data && data.message) || 'Gebäudetypen konnten nicht geladen werden.');
    }
    return data || [];
  }

  async function buildBuilding(gebaeudeTypId, anzahl) {
    const { data } = await postRequest('/api/buildings/build', { gebaeudeTypId, anzahl });
    return data || { message: 'Unbekannter Fehler beim Bauen.' };
  }

  async function getMilitaryStatus() {
    const { response, data } = await getRequest('/api/military/status');
    if (!response.ok) {
      if (response.status === 401) {
        global.location.href = '/login.html';
        return null;
      }
      throw new Error((data && data.message) || 'Militärstatus konnte nicht geladen werden.');
    }
    return data;
  }

  async function upgradeKaserne() {
    const { data } = await postRequest('/api/military/upgrade', {});
    return data || { message: 'Unbekannter Fehler beim Kaserne-Upgrade.' };
  }

  async function trainEinheit(einheitTypId, anzahl) {
    const { data } = await postRequest('/api/military/train', { einheitTypId, anzahl });
    return data || { message: 'Unbekannter Fehler bei der Ausbildung.' };
  }

  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
  }

  global.CoreApi = {
    getRequest,
    postRequest,
    getMe,
    getBuildingTypes,
    buildBuilding,
    getMilitaryStatus,
    upgradeKaserne,
    trainEinheit,
    logout,
  };
}(window));
