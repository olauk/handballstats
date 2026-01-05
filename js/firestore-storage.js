// ============================================
// FIRESTORE CLOUD STORAGE
// ============================================
import { APP, PERFORMANCE } from './state.js';
import { auth, db } from './firebase-config.js';

// ============================================
// SAVE ACTIVE MATCH TO FIRESTORE
// ============================================
export async function saveMatchToFirestore() {
    if (!auth.currentUser) {
        console.warn('⚠️ Cannot save to Firestore: No user logged in');
        return false;
    }

    // Don't save if there's no active match data
    if (APP.players.length === 0 && APP.opponents.length === 0 && APP.events.length === 0) {
        console.log('ℹ️ No active match data to save');
        return true;
    }

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
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Use a fixed document ID for the active match
        await db.collection('users').doc(userId).collection('matches').doc('active').set(matchData, { merge: true });

        console.log('✅ Active match saved to Firestore');
        return true;
    } catch (error) {
        console.error('❌ Error saving match to Firestore:', error);
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
        const matchDoc = await db.collection('users').doc(userId).collection('matches').doc('active').get();

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
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('users').doc(userId).collection('matches').doc(matchId).set(firestoreMatchData);

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
        const matchesSnapshot = await db.collection('users').doc(userId).collection('matches')
            .where('status', '==', 'completed')
            .orderBy('completedAt', 'desc')
            .get();

        const matches = [];
        matchesSnapshot.forEach(doc => {
            matches.push(doc.data());
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

        // Mark migration as complete
        await db.collection('users').doc(userId).update({
            migrated: true,
            migratedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ Migration complete! Migrated ${migratedCount} matches to Firestore`);
        return true;

    } catch (error) {
        console.error('❌ Error during migration:', error);
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
            APP.homeTeam = activeMatch.homeTeam || APP.homeTeam;
            APP.awayTeam = activeMatch.awayTeam || APP.awayTeam;
            APP.matchDate = activeMatch.matchDate || APP.matchDate;
            APP.currentHalf = activeMatch.currentHalf || APP.currentHalf;
            APP.players = activeMatch.players || [];
            APP.opponents = activeMatch.opponents || [];
            APP.events = activeMatch.events || [];
            APP.activeKeeper = activeMatch.activeKeeper || null;
            APP.mode = activeMatch.mode || 'attack';

            // Invalidate stats cache
            PERFORMANCE.invalidateStatsCache();
        }

        // Load completed matches
        const completedMatches = await loadCompletedMatchesFromFirestore();
        APP.completedMatches = completedMatches;

        console.log('✅ Sync complete');
        return true;

    } catch (error) {
        console.error('❌ Error syncing from Firestore:', error);
        return false;
    }
}
