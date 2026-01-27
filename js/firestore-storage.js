// ============================================
// FIRESTORE CLOUD STORAGE
// ============================================
import { APP, PERFORMANCE } from './state.js';
import { auth, db } from './firebase-config.js';
import { logAppEvent } from './debug-logger.js';

// ============================================
// SAVE ACTIVE MATCH TO FIRESTORE
// ============================================
export async function saveMatchToFirestore() {
  // ============================================
  // VALIDATION
  // ============================================

  if (!auth.currentUser) {
    console.warn('⚠️ Cannot save to Firestore: No user logged in');
    return false;
  }

  // Don't save if there's no active match data
  if (APP.players.length === 0 && APP.opponents.length === 0 && APP.events.length === 0) {
    console.log('ℹ️ No active match data to save');
    return true;
  }

  // ============================================
  // PREPARE DATA
  // ============================================

  try {
    const userId = auth.currentUser.uid;
    const matchData = {
      homeTeam: APP.homeTeam,
      awayTeam: APP.awayTeam,
      matchDate: APP.matchDate,
      currentHalf: APP.currentHalf,
      players: APP.players,
      opponents: APP.opponents,
      events: APP.events,
      activeKeeper: APP.activeKeeper,
      mode: APP.mode,
      status: 'active',
      ownerId: userId,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    // ============================================
    // SAVE TO FIRESTORE
    // ============================================

    // Use a fixed document ID for the active match
    await db
      .collection('users')
      .doc(userId)
      .collection('matches')
      .doc('active')
      .set(matchData, { merge: true });

    console.log('✅ Active match saved to Firestore');
    return true;
  } catch (error) {
    // ============================================
    // ERROR HANDLING
    // ============================================

    console.error('❌ Error saving match to Firestore:', error);

    // Handle different error types
    if (error.code === 'unavailable') {
      // Network error - silent fail, will retry automatically
      console.warn('⚠️ Firestore unavailable (network error) - will retry on next save');
    } else if (error.code === 'permission-denied') {
      // Permission error - critical
      console.error('🔴 CRITICAL: Permission denied - check Firestore security rules');
      // Don't show alert - this should not happen in production
    } else {
      // Other errors - log but don't alert (non-critical since localStorage is primary)
      console.error('⚠️ Firestore save failed (non-critical):', error.message);
    }

    // Log error for debugging
    try {
      await logAppEvent('error', {
        function: 'saveMatchToFirestore',
        error: error.message,
        errorCode: error.code,
        errorName: error.name,
      });
    } catch (logError) {
      console.error('Failed to log Firestore error:', logError);
    }

    return false;
  }
}

// Debounced save to Firestore (similar to localStorage)
let firestoreSaveTimeout = null;
export function saveMatchToFirestoreDebounced() {
  clearTimeout(firestoreSaveTimeout);
  firestoreSaveTimeout = setTimeout(() => {
    saveMatchToFirestore();
  }, 1000); // 1 second debounce
}

// ============================================
// LOAD ACTIVE MATCH FROM FIRESTORE
// ============================================
export async function loadActiveMatchFromFirestore() {
  if (!auth.currentUser) {
    console.log('ℹ️ No user logged in, skipping Firestore load');
    return null;
  }

  try {
    const userId = auth.currentUser.uid;
    const matchDoc = await db
      .collection('users')
      .doc(userId)
      .collection('matches')
      .doc('active')
      .get();

    if (matchDoc.exists) {
      const data = matchDoc.data();
      console.log('✅ Active match loaded from Firestore');
      return data;
    } else {
      console.log('ℹ️ No active match found in Firestore');
      return null;
    }
  } catch (error) {
    console.error('❌ Error loading match from Firestore:', error);
    return null;
  }
}

// ============================================
// SAVE COMPLETED MATCH TO FIRESTORE
// ============================================
export async function saveCompletedMatchToFirestore(matchData) {
  if (!auth.currentUser) {
    console.warn('⚠️ Cannot save completed match: No user logged in');
    return false;
  }

  try {
    const userId = auth.currentUser.uid;

    // Generate unique match ID if not present
    const matchId = matchData.id || Date.now().toString();

    const firestoreMatchData = {
      ...matchData,
      id: matchId,
      status: 'completed',
      ownerId: userId,
      completedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    // Convert matchId to string for Firestore document ID
    await db
      .collection('users')
      .doc(userId)
      .collection('matches')
      .doc(matchId.toString())
      .set(firestoreMatchData);

    console.log('✅ Completed match saved to Firestore:', matchId);
    return matchId;
  } catch (error) {
    console.error('❌ Error saving completed match:', error);
    return false;
  }
}

// ============================================
// LOAD ALL COMPLETED MATCHES FROM FIRESTORE
// ============================================
export async function loadCompletedMatchesFromFirestore() {
  if (!auth.currentUser) {
    console.log('ℹ️ No user logged in, skipping completed matches load');
    return [];
  }

  try {
    const userId = auth.currentUser.uid;

    // Get all matches from the user's collection
    const matchesSnapshot = await db.collection('users').doc(userId).collection('matches').get();

    const matches = [];
    matchesSnapshot.forEach((doc) => {
      const data = doc.data();
      // Filter out the 'active' document and only include completed matches
      if (doc.id !== 'active' && data.status === 'completed') {
        matches.push(data);
      }
    });

    // Sort by completedAt on the client side
    matches.sort((a, b) => {
      const aTime = a.completedAt?.toMillis?.() || 0;
      const bTime = b.completedAt?.toMillis?.() || 0;
      return bTime - aTime; // Descending order (newest first)
    });

    console.log(`✅ Loaded ${matches.length} completed matches from Firestore`);
    return matches;
  } catch (error) {
    console.error('❌ Error loading completed matches:', error);
    return [];
  }
}

// ============================================
// DELETE COMPLETED MATCH FROM FIRESTORE
// ============================================
export async function deleteCompletedMatchFromFirestore(matchId) {
  if (!auth.currentUser) {
    console.warn('⚠️ Cannot delete match: No user logged in');
    return false;
  }

  try {
    const userId = auth.currentUser.uid;
    await db.collection('users').doc(userId).collection('matches').doc(matchId.toString()).delete();

    console.log('✅ Match deleted from Firestore:', matchId);
    return true;
  } catch (error) {
    console.error('❌ Error deleting match from Firestore:', error);
    return false;
  }
}

// ============================================
// MIGRATE LOCALSTORAGE DATA TO FIRESTORE
// ============================================
export async function migrateLocalStorageToFirestore() {
  if (!auth.currentUser) {
    console.log('ℹ️ No user logged in, skipping migration');
    return false;
  }

  try {
    console.log('🔄 Starting migration from localStorage to Firestore...');

    // Check if migration has already been done
    const userId = auth.currentUser.uid;
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (userData?.migrated) {
      console.log('✅ Migration already completed');
      return true;
    }

    let migratedCount = 0;

    // Migrate completed matches
    if (APP.completedMatches && APP.completedMatches.length > 0) {
      console.log(`📦 Migrating ${APP.completedMatches.length} completed matches...`);

      for (const match of APP.completedMatches) {
        await saveCompletedMatchToFirestore(match);
        migratedCount++;
      }
    }

    // Migrate active match if exists
    if (APP.players.length > 0 || APP.opponents.length > 0 || APP.events.length > 0) {
      console.log('📦 Migrating active match...');
      await saveMatchToFirestore();
      migratedCount++;
    }

    // Migrate team rosters
    if (APP.savedTeams && APP.savedTeams.length > 0) {
      console.log(`📦 Migrating ${APP.savedTeams.length} team rosters...`);

      for (const team of APP.savedTeams) {
        await saveTeamRosterToFirestore(team);
        migratedCount++;
      }
    }

    // Migrate user preferences
    console.log('📦 Migrating user preferences...');
    await saveUserPreferencesToFirestore();
    migratedCount++;

    // Mark migration as complete
    await db.collection('users').doc(userId).set(
      {
        migrated: true,
        migratedAt: firebase.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log(`✅ Migration complete! Migrated ${migratedCount} items to Firestore`);
    return true;
  } catch (error) {
    console.error('❌ Error during migration:', error);
    return false;
  }
}

// ============================================
// TEAM ROSTER OPERATIONS
// ============================================

/**
 * Save a team roster to Firestore
 * @param {Object} team - Team roster object with id, name, players
 * @returns {Promise<boolean>} Success status
 */
export async function saveTeamRosterToFirestore(team) {
  if (!auth.currentUser) {
    console.warn('⚠️ Cannot save team roster: No user logged in');
    return false;
  }

  if (!team || !team.id) {
    console.warn('⚠️ Invalid team data - missing ID');
    return false;
  }

  try {
    const userId = auth.currentUser.uid;
    const teamData = {
      id: team.id,
      name: team.name || 'Ukjent lag',
      players: team.players || [],
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      ownerId: userId,
    };

    await db
      .collection('users')
      .doc(userId)
      .collection('teamRosters')
      .doc(team.id.toString())
      .set(teamData, { merge: true });

    console.log('✅ Team roster saved to Firestore:', team.name);
    return true;
  } catch (error) {
    console.error('❌ Error saving team roster to Firestore:', error);
    return false;
  }
}

/**
 * Save all team rosters to Firestore
 * @returns {Promise<boolean>} Success status
 */
export async function saveAllTeamRostersToFirestore() {
  if (!auth.currentUser) {
    console.warn('⚠️ Cannot save team rosters: No user logged in');
    return false;
  }

  if (!APP.savedTeams || APP.savedTeams.length === 0) {
    console.log('ℹ️ No team rosters to save');
    return true;
  }

  try {
    console.log(`📦 Saving ${APP.savedTeams.length} team rosters to Firestore...`);
    let savedCount = 0;

    for (const team of APP.savedTeams) {
      const success = await saveTeamRosterToFirestore(team);
      if (success) {
        savedCount++;
      }
    }

    console.log(`✅ Saved ${savedCount}/${APP.savedTeams.length} team rosters to Firestore`);
    return savedCount === APP.savedTeams.length;
  } catch (error) {
    console.error('❌ Error saving team rosters:', error);
    return false;
  }
}

/**
 * Load all team rosters from Firestore
 * @returns {Promise<Array>} Array of team roster objects
 */
export async function loadTeamRostersFromFirestore() {
  if (!auth.currentUser) {
    console.log('ℹ️ No user logged in, skipping team rosters load');
    return [];
  }

  try {
    const userId = auth.currentUser.uid;
    const rostersSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('teamRosters')
      .get();

    const rosters = [];
    rostersSnapshot.forEach((doc) => {
      const data = doc.data();
      rosters.push({
        id: data.id,
        name: data.name,
        players: data.players || [],
        updatedAt: data.updatedAt,
      });
    });

    // Sort by name for consistent display
    rosters.sort((a, b) => a.name.localeCompare(b.name));

    console.log(`✅ Loaded ${rosters.length} team rosters from Firestore`);
    return rosters;
  } catch (error) {
    console.error('❌ Error loading team rosters from Firestore:', error);
    return [];
  }
}

/**
 * Delete a team roster from Firestore
 * @param {number|string} teamId - Team roster ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteTeamRosterFromFirestore(teamId) {
  if (!auth.currentUser) {
    console.warn('⚠️ Cannot delete team roster: No user logged in');
    return false;
  }

  try {
    const userId = auth.currentUser.uid;
    await db
      .collection('users')
      .doc(userId)
      .collection('teamRosters')
      .doc(teamId.toString())
      .delete();

    console.log('✅ Team roster deleted from Firestore:', teamId);
    return true;
  } catch (error) {
    console.error('❌ Error deleting team roster from Firestore:', error);
    return false;
  }
}

// ============================================
// USER PREFERENCES OPERATIONS
// ============================================

/**
 * Save user preferences to Firestore
 * @returns {Promise<boolean>} Success status
 */
export async function saveUserPreferencesToFirestore() {
  if (!auth.currentUser) {
    console.warn('⚠️ Cannot save preferences: No user logged in');
    return false;
  }

  try {
    const userId = auth.currentUser.uid;
    const preferences = {
      matchMode: APP.matchMode || 'simple',
      shotRegistrationMode: APP.shotRegistrationMode || 'simple',
      timerConfig: {
        halfLength: APP.timerConfig?.halfLength || 30,
      },
    };

    await db.collection('users').doc(userId).set(
      {
        preferences,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        ownerId: userId,
      },
      { merge: true }
    );

    console.log('✅ User preferences saved to Firestore');
    return true;
  } catch (error) {
    console.error('❌ Error saving user preferences to Firestore:', error);
    return false;
  }
}

/**
 * Load user preferences from Firestore
 * @returns {Promise<Object|null>} Preferences object or null if not found
 */
export async function loadUserPreferencesFromFirestore() {
  if (!auth.currentUser) {
    console.log('ℹ️ No user logged in, skipping preferences load');
    return null;
  }

  try {
    const userId = auth.currentUser.uid;
    const doc = await db.collection('users').doc(userId).get();

    if (!doc.exists || !doc.data().preferences) {
      console.log('ℹ️ No user preferences found in Firestore');
      return null;
    }

    const preferences = doc.data().preferences;
    console.log('✅ User preferences loaded from Firestore');
    return preferences;
  } catch (error) {
    console.error('❌ Error loading user preferences from Firestore:', error);
    return null;
  }
}

// ============================================
// SEASON OPERATIONS
// ============================================

/**
 * Create a new season in Firestore
 * @param {string} seasonName - Name of the season
 * @returns {Promise<Object|null>} Created season object or null if failed
 */
export async function createSeasonInFirestore(seasonName) {
  if (!auth.currentUser) {
    console.warn('⚠️ Cannot create season: No user logged in');
    return null;
  }

  if (!seasonName || seasonName.trim() === '') {
    console.warn('⚠️ Invalid season name');
    return null;
  }

  try {
    const userId = auth.currentUser.uid;
    const seasonId = `season_${Date.now()}`;

    const seasonData = {
      id: seasonId,
      name: seasonName.trim(),
      startDate: firebase.firestore.FieldValue.serverTimestamp(),
      endDate: null, // null means season is ongoing
      matches: [], // Array of match IDs
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      ownerId: userId,
    };

    await db.collection('users').doc(userId).collection('seasons').doc(seasonId).set(seasonData);

    console.log('✅ Season created in Firestore:', seasonName);

    // Return season with client-side timestamp for immediate use
    return {
      ...seasonData,
      startDate: new Date(),
      createdAt: new Date(),
    };
  } catch (error) {
    console.error('❌ Error creating season in Firestore:', error);
    return null;
  }
}

/**
 * Load all seasons from Firestore
 * @returns {Promise<Array>} Array of season objects
 */
export async function loadSeasonsFromFirestore() {
  if (!auth.currentUser) {
    console.log('ℹ️ No user logged in, skipping seasons load');
    return [];
  }

  try {
    const userId = auth.currentUser.uid;
    const seasonsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('seasons')
      .orderBy('createdAt', 'desc')
      .get();

    const seasons = [];
    seasonsSnapshot.forEach((doc) => {
      const data = doc.data();
      seasons.push({
        id: data.id,
        name: data.name,
        startDate: data.startDate?.toDate ? data.startDate.toDate() : data.startDate,
        endDate: data.endDate?.toDate ? data.endDate.toDate() : data.endDate,
        matches: data.matches || [],
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
      });
    });

    console.log(`✅ Loaded ${seasons.length} seasons from Firestore`);
    return seasons;
  } catch (error) {
    console.error('❌ Error loading seasons from Firestore:', error);
    return [];
  }
}

/**
 * Add a match to a season
 * @param {string} seasonId - Season ID
 * @param {string} matchId - Match ID to add
 * @returns {Promise<boolean>} Success status
 */
export async function addMatchToSeasonInFirestore(seasonId, matchId) {
  if (!auth.currentUser) {
    console.warn('⚠️ Cannot add match to season: No user logged in');
    return false;
  }

  try {
    const userId = auth.currentUser.uid;
    const seasonRef = db.collection('users').doc(userId).collection('seasons').doc(seasonId);

    await seasonRef.update({
      matches: firebase.firestore.FieldValue.arrayUnion(matchId),
    });

    console.log(`✅ Match ${matchId} added to season ${seasonId}`);
    return true;
  } catch (error) {
    console.error('❌ Error adding match to season:', error);
    return false;
  }
}

/**
 * Remove a match from a season
 * @param {string} seasonId - Season ID
 * @param {string} matchId - Match ID to remove
 * @returns {Promise<boolean>} Success status
 */
export async function removeMatchFromSeasonInFirestore(seasonId, matchId) {
  if (!auth.currentUser) {
    console.warn('⚠️ Cannot remove match from season: No user logged in');
    return false;
  }

  try {
    const userId = auth.currentUser.uid;
    const seasonRef = db.collection('users').doc(userId).collection('seasons').doc(seasonId);

    await seasonRef.update({
      matches: firebase.firestore.FieldValue.arrayRemove(matchId),
    });

    console.log(`✅ Match ${matchId} removed from season ${seasonId}`);
    return true;
  } catch (error) {
    console.error('❌ Error removing match from season:', error);
    return false;
  }
}

/**
 * End a season (set endDate)
 * @param {string} seasonId - Season ID
 * @returns {Promise<boolean>} Success status
 */
export async function endSeasonInFirestore(seasonId) {
  if (!auth.currentUser) {
    console.warn('⚠️ Cannot end season: No user logged in');
    return false;
  }

  try {
    const userId = auth.currentUser.uid;
    const seasonRef = db.collection('users').doc(userId).collection('seasons').doc(seasonId);

    await seasonRef.update({
      endDate: firebase.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Season ${seasonId} ended`);
    return true;
  } catch (error) {
    console.error('❌ Error ending season:', error);
    return false;
  }
}

/**
 * Delete a season from Firestore
 * @param {string} seasonId - Season ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteSeasonFromFirestore(seasonId) {
  if (!auth.currentUser) {
    console.warn('⚠️ Cannot delete season: No user logged in');
    return false;
  }

  try {
    const userId = auth.currentUser.uid;
    await db.collection('users').doc(userId).collection('seasons').doc(seasonId).delete();

    console.log('✅ Season deleted from Firestore:', seasonId);
    return true;
  } catch (error) {
    console.error('❌ Error deleting season from Firestore:', error);
    return false;
  }
}

// ============================================
// SYNC: LOAD ALL DATA FROM FIRESTORE
// ============================================
export async function syncFromFirestore() {
  if (!auth.currentUser) {
    console.log('ℹ️ No user logged in, skipping sync');
    return false;
  }

  try {
    console.log('🔄 Syncing data from Firestore...');

    // Load active match
    const activeMatch = await loadActiveMatchFromFirestore();
    if (activeMatch) {
      // Check if we have local data to merge
      const hasLocalData = APP.events.length > 0 || APP.players.length > 0;

      if (hasLocalData) {
        // MERGE STRATEGY: Combine local and Firestore data intelligently
        console.log('🔀 Merging local and Firestore data...');

        // Merge events based on ID to avoid duplicates
        const localEvents = APP.events || [];
        const firestoreEvents = activeMatch.events || [];

        // Create a Map to deduplicate by event ID
        const eventMap = new Map();

        // Add local events first
        localEvents.forEach((event) => {
          eventMap.set(event.id, event);
        });

        // Add Firestore events (if not already present)
        let newEventsCount = 0;
        firestoreEvents.forEach((event) => {
          if (!eventMap.has(event.id)) {
            eventMap.set(event.id, event);
            newEventsCount++;
          }
        });

        // Convert back to array and sort by id (chronological order)
        APP.events = Array.from(eventMap.values()).sort((a, b) => a.id - b.id);

        if (newEventsCount > 0) {
          console.log(`✅ Merged ${newEventsCount} new events from Firestore`);
        }

        // Merge players/opponents (prefer Firestore if local is empty, otherwise keep local)
        APP.players = APP.players.length > 0 ? APP.players : activeMatch.players || [];
        APP.opponents = APP.opponents.length > 0 ? APP.opponents : activeMatch.opponents || [];

        // For other fields, prefer local if exists, otherwise use Firestore
        APP.homeTeam = APP.homeTeam !== 'Eget lag' ? APP.homeTeam : activeMatch.homeTeam;
        APP.awayTeam = APP.awayTeam !== 'Motstander' ? APP.awayTeam : activeMatch.awayTeam;
        APP.matchDate = APP.matchDate || activeMatch.matchDate;
        APP.currentHalf = APP.currentHalf || activeMatch.currentHalf;
        APP.activeKeeper = APP.activeKeeper || activeMatch.activeKeeper;
        APP.mode = APP.mode || activeMatch.mode;
      } else {
        // No local data, just use Firestore data directly
        console.log('📥 Loading data from Firestore (no local data)...');
        APP.homeTeam = activeMatch.homeTeam || APP.homeTeam;
        APP.awayTeam = activeMatch.awayTeam || APP.awayTeam;
        APP.matchDate = activeMatch.matchDate || APP.matchDate;
        APP.currentHalf = activeMatch.currentHalf || APP.currentHalf;
        APP.players = activeMatch.players || [];
        APP.opponents = activeMatch.opponents || [];
        APP.events = activeMatch.events || [];
        APP.activeKeeper = activeMatch.activeKeeper || null;
        APP.mode = activeMatch.mode || 'attack';
      }

      // Invalidate stats cache after merge
      PERFORMANCE.invalidateStatsCache();
    }

    // Load and merge completed matches
    const firestoreMatches = await loadCompletedMatchesFromFirestore();
    const localMatches = APP.completedMatches || [];

    // Merge completed matches by ID (avoid duplicates)
    const matchMap = new Map();

    // Add local matches
    localMatches.forEach((match) => {
      matchMap.set(match.id, match);
    });

    // Add Firestore matches (overwrites local if same ID - Firestore is source of truth)
    firestoreMatches.forEach((match) => {
      matchMap.set(match.id, match);
    });

    APP.completedMatches = Array.from(matchMap.values());

    // Load and merge team rosters
    const firestoreRosters = await loadTeamRostersFromFirestore();
    const localRosters = APP.savedTeams || [];

    // Merge team rosters by ID (Firestore is source of truth)
    const rosterMap = new Map();

    // Add local rosters first
    localRosters.forEach((roster) => {
      rosterMap.set(roster.id, roster);
    });

    // Add/overwrite with Firestore rosters
    firestoreRosters.forEach((roster) => {
      rosterMap.set(roster.id, roster);
    });

    APP.savedTeams = Array.from(rosterMap.values());

    if (firestoreRosters.length > 0) {
      console.log(`✅ Synced ${firestoreRosters.length} team rosters from Firestore`);
    }

    // Load and apply user preferences (Firestore is source of truth)
    const firestorePreferences = await loadUserPreferencesFromFirestore();
    if (firestorePreferences) {
      // Apply preferences to APP state
      APP.matchMode = firestorePreferences.matchMode || APP.matchMode;
      APP.shotRegistrationMode =
        firestorePreferences.shotRegistrationMode || APP.shotRegistrationMode;

      if (firestorePreferences.timerConfig) {
        APP.timerConfig.halfLength =
          firestorePreferences.timerConfig.halfLength || APP.timerConfig.halfLength;
      }

      console.log('✅ User preferences synced from Firestore');
    }

    // Load and merge seasons
    const firestoreSeasons = await loadSeasonsFromFirestore();
    const localSeasons = APP.seasons || [];

    // Merge seasons by ID (Firestore is source of truth)
    const seasonMap = new Map();

    // Add local seasons first
    localSeasons.forEach((season) => {
      seasonMap.set(season.id, season);
    });

    // Add/overwrite with Firestore seasons
    firestoreSeasons.forEach((season) => {
      seasonMap.set(season.id, season);
    });

    APP.seasons = Array.from(seasonMap.values());

    if (firestoreSeasons.length > 0) {
      console.log(`✅ Synced ${firestoreSeasons.length} seasons from Firestore`);
    }

    console.log('✅ Sync complete');
    return true;
  } catch (error) {
    console.error('❌ Error syncing from Firestore:', error);
    return false;
  }
}
