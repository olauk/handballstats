/**
 * Debug Logger - Tracks all shot registrations and events for debugging
 * Stores comprehensive logs in Firestore for troubleshooting and analysis
 */

import { auth, db } from './firebase-config.js';
import { APP } from './state.js';

/**
 * Logs a shot registration event to Firestore
 * @param {Object} eventData - The event data to log
 * @param {string} eventData.eventType - Type of event (e.g., 'goal', 'save', 'miss')
 * @param {Object} eventData.player - Player who took the shot or made the save
 * @param {Object} eventData.keeper - Active keeper (for defense mode)
 * @param {string} eventData.result - Result of the shot
 * @param {Object} eventData.position - Position where shot was taken/landed
 * @param {string} eventData.half - Which half (1 or 2)
 */
export async function logShotEvent(eventData) {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.warn('⚠️ Cannot log event - no user logged in');
            return;
        }

        // Get current match ID (use active match or generate temporary ID)
        const matchId = APP.matchId || 'active';

        // Prepare comprehensive log entry
        const logEntry = {
            // Timestamps
            clientTimestamp: new Date().toISOString(),
            serverTimestamp: firebase.firestore.FieldValue.serverTimestamp(),

            // Event details
            eventType: eventData.eventType,
            result: eventData.result,
            half: eventData.half,

            // Player information
            player: eventData.player ? {
                id: eventData.player.id,
                name: eventData.player.name,
                number: eventData.player.number,
                isKeeper: eventData.player.isKeeper
            } : null,

            // Keeper information (for defense mode)
            keeper: eventData.keeper ? {
                id: eventData.keeper.id,
                name: eventData.keeper.name,
                number: eventData.keeper.number
            } : null,

            // Shot position
            position: eventData.position || null,

            // Match context
            matchContext: {
                matchId: matchId,
                homeTeam: APP.homeTeam,
                awayTeam: APP.awayTeam,
                mode: APP.mode,
                half: APP.currentHalf,
                totalEvents: APP.events.length
            },

            // Keeper stats at time of event
            keeperStats: APP.mode === 'defense' && APP.activeKeeper ? {
                saves: APP.activeKeeper.saves || 0,
                goals: APP.activeKeeper.goals || 0,
                savePercentage: APP.activeKeeper.savePercentage || 0
            } : null,

            // Browser/device info
            userAgent: navigator.userAgent,
            screenSize: `${window.innerWidth}x${window.innerHeight}`,

            // User ID
            userId: user.uid
        };

        // Save to Firestore under users/{uid}/debug_logs/{autoId}
        await db.collection('users')
            .doc(user.uid)
            .collection('debug_logs')
            .add(logEntry);

        console.log('✅ Event logged:', eventData.eventType, eventData.result);

    } catch (error) {
        // Don't let logging errors break the app
        console.error('❌ Failed to log event:', error);
    }
}

/**
 * Logs a general app event (not shot-related)
 * @param {string} eventType - Type of event (e.g., 'match_started', 'match_finished', 'player_added')
 * @param {Object} data - Additional data to log
 */
export async function logAppEvent(eventType, data = {}) {
    try {
        const user = auth.currentUser;
        if (!user) return;

        const logEntry = {
            clientTimestamp: new Date().toISOString(),
            serverTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
            eventType: eventType,
            data: data,
            userId: user.uid
        };

        await db.collection('users')
            .doc(user.uid)
            .collection('debug_logs')
            .add(logEntry);

        console.log('✅ App event logged:', eventType);

    } catch (error) {
        console.error('❌ Failed to log app event:', error);
    }
}

/**
 * Retrieves all debug logs for the current user
 * @param {number} limit - Maximum number of logs to retrieve (default: 100)
 * @returns {Promise<Array>} Array of log entries
 */
export async function getDebugLogs(limit = 100) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No user logged in');
        }

        const logsSnapshot = await db.collection('users')
            .doc(user.uid)
            .collection('debug_logs')
            .orderBy('clientTimestamp', 'desc')
            .limit(limit)
            .get();

        const logs = [];
        logsSnapshot.forEach(doc => {
            logs.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return logs;

    } catch (error) {
        console.error('❌ Failed to retrieve debug logs:', error);
        throw error;
    }
}

/**
 * Exports debug logs as JSON file
 * @param {number} limit - Maximum number of logs to export (default: 500)
 */
export async function exportDebugLogs(limit = 500) {
    try {
        console.log('📥 Fetching debug logs...');
        const logs = await getDebugLogs(limit);

        if (logs.length === 0) {
            alert('Ingen logger å eksportere ennå.');
            return;
        }

        // Convert to JSON with formatting
        const jsonData = JSON.stringify(logs, null, 2);

        // Create blob and download
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = `handball-debug-logs-${new Date().toISOString().split('T')[0]}.json`;

        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        URL.revokeObjectURL(url);

        console.log(`✅ Exported ${logs.length} log entries`);
        alert(`✅ Eksportert ${logs.length} logger til JSON-fil`);

    } catch (error) {
        console.error('❌ Failed to export debug logs:', error);
        alert('❌ Kunne ikke eksportere logger. Se konsollen for detaljer.');
    }
}

/**
 * Deletes old debug logs (older than specified days)
 * @param {number} daysToKeep - Keep logs from last N days (default: 30)
 */
export async function cleanOldLogs(daysToKeep = 30) {
    try {
        const user = auth.currentUser;
        if (!user) return;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const cutoffISO = cutoffDate.toISOString();

        const oldLogsSnapshot = await db.collection('users')
            .doc(user.uid)
            .collection('debug_logs')
            .where('clientTimestamp', '<', cutoffISO)
            .get();

        // Delete in batches
        const batch = db.batch();
        let count = 0;

        oldLogsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
            count++;
        });

        if (count > 0) {
            await batch.commit();
            console.log(`🗑️ Deleted ${count} old log entries`);
        }

        return count;

    } catch (error) {
        console.error('❌ Failed to clean old logs:', error);
        return 0;
    }
}
