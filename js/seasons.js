// ============================================
// SEASON MANAGEMENT
// ============================================
import { APP } from './state.js';
import { saveToLocalStorage, saveToLocalStorageImmediate } from './storage.js';
import {
  createSeasonInFirestore,
  deleteSeasonFromFirestore,
  addMatchToSeasonInFirestore,
  removeMatchFromSeasonInFirestore,
  endSeasonInFirestore,
} from './firestore-storage.js';

/**
 * Create a new season
 * @param {string} seasonName - Name of the season
 * @returns {Promise<boolean>} Success status
 */
export async function createSeason(seasonName) {
  if (!seasonName || seasonName.trim() === '') {
    alert('Du må angi et sesong-navn');
    return false;
  }

  // Create season in Firestore
  const newSeason = await createSeasonInFirestore(seasonName);

  if (newSeason) {
    // Add to local state
    APP.seasons.push(newSeason);
    saveToLocalStorageImmediate();
    return true;
  }

  alert('Kunne ikke opprette sesong. Prøv igjen.');
  return false;
}

/**
 * Delete a season
 * @param {string} seasonId - Season ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteSeason(seasonId) {
  const season = APP.seasons.find((s) => s.id === seasonId);
  if (!season) {
    return false;
  }

  const matchCount = season.matches ? season.matches.length : 0;
  const confirmMessage =
    matchCount > 0
      ? `Er du sikker på at du vil slette sesongen "${season.name}"?\n\nDenne sesongen inneholder ${matchCount} kamp(er). Kampene vil ikke bli slettet, men de vil ikke lenger være koblet til denne sesongen.`
      : `Er du sikker på at du vil slette sesongen "${season.name}"?`;

  if (confirm(confirmMessage)) {
    APP.seasons = APP.seasons.filter((s) => s.id !== seasonId);

    // Save to localStorage immediately
    saveToLocalStorageImmediate();

    // Delete from Firestore (non-blocking, background operation)
    deleteSeasonFromFirestore(seasonId).catch((error) => {
      console.error('Failed to delete season from Firestore:', error);
      // Silent fail - localStorage is primary, Firestore is backup
    });

    return true;
  }
  return false;
}

/**
 * Add a match to a season
 * @param {string} seasonId - Season ID
 * @param {string} matchId - Match ID
 * @returns {Promise<boolean>} Success status
 */
export async function addMatchToSeason(seasonId, matchId) {
  const season = APP.seasons.find((s) => s.id === seasonId);
  if (!season) {
    return false;
  }

  // Check if match is already in season
  if (season.matches && season.matches.includes(matchId)) {
    alert('Denne kampen er allerede i sesongen');
    return false;
  }

  // Add to local state
  if (!season.matches) {
    season.matches = [];
  }
  season.matches.push(matchId);

  // Save to localStorage immediately
  saveToLocalStorageImmediate();

  // Add to Firestore (non-blocking, background operation)
  addMatchToSeasonInFirestore(seasonId, matchId).catch((error) => {
    console.error('Failed to add match to season in Firestore:', error);
    // Silent fail - localStorage is primary, Firestore is backup
  });

  return true;
}

/**
 * Remove a match from a season
 * @param {string} seasonId - Season ID
 * @param {string} matchId - Match ID
 * @returns {Promise<boolean>} Success status
 */
export async function removeMatchFromSeason(seasonId, matchId) {
  const season = APP.seasons.find((s) => s.id === seasonId);
  if (!season || !season.matches) {
    return false;
  }

  // Remove from local state
  season.matches = season.matches.filter((id) => id !== matchId);

  // Save to localStorage immediately
  saveToLocalStorageImmediate();

  // Remove from Firestore (non-blocking, background operation)
  removeMatchFromSeasonInFirestore(seasonId, matchId).catch((error) => {
    console.error('Failed to remove match from season in Firestore:', error);
    // Silent fail - localStorage is primary, Firestore is backup
  });

  return true;
}

/**
 * End a season (set endDate to now)
 * @param {string} seasonId - Season ID
 * @returns {Promise<boolean>} Success status
 */
export async function endSeason(seasonId) {
  const season = APP.seasons.find((s) => s.id === seasonId);
  if (!season) {
    return false;
  }

  if (season.endDate) {
    alert('Denne sesongen er allerede avsluttet');
    return false;
  }

  if (confirm(`Er du sikker på at du vil avslutte sesongen "${season.name}"?`)) {
    // Set endDate in local state
    season.endDate = new Date();

    // Save to localStorage immediately
    saveToLocalStorageImmediate();

    // End in Firestore (non-blocking, background operation)
    endSeasonInFirestore(seasonId).catch((error) => {
      console.error('Failed to end season in Firestore:', error);
      // Silent fail - localStorage is primary, Firestore is backup
    });

    return true;
  }

  return false;
}

/**
 * Get season by ID
 * @param {string} seasonId - Season ID
 * @returns {Object|null} Season object or null if not found
 */
export function getSeasonById(seasonId) {
  return APP.seasons.find((s) => s.id === seasonId) || null;
}

/**
 * Get all active (ongoing) seasons
 * @returns {Array} Array of active season objects
 */
export function getActiveSeasons() {
  return APP.seasons.filter((s) => !s.endDate);
}

/**
 * Get all ended seasons
 * @returns {Array} Array of ended season objects
 */
export function getEndedSeasons() {
  return APP.seasons.filter((s) => s.endDate);
}
