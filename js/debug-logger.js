/**
 * Debug Logger - Tracks all shot registrations and events for debugging
 * Stores comprehensive logs in Firestore for troubleshooting and analysis
 *
 * PRODUCTION MODE: Debug logging is disabled by default in production to:
 * - Reduce Firestore costs (write operations)
 * - Protect user privacy (detailed event data)
 * - Improve performance
 *
 * Enable debug mode by:
 * 1. Adding ?debug=true to URL
 * 2. Setting localStorage: localStorage.setItem('debugMode', 'true')
 * 3. Running in development (localhost)
 */

import { auth, db } from './firebase-config.js';
import { APP } from './state.js';

/**
 * Checks if debug logging should be enabled
 * @returns {boolean} True if in development or debug mode is explicitly enabled
 */
function shouldLog() {
    // Check if running on localhost (development)
    const isDevelopment = window.location.hostname === 'localhost' ||
                         window.location.hostname === '127.0.0.1';

    // Check if debug mode is explicitly enabled via URL parameter
    const urlDebugMode = window.location.search.includes('debug=true');

    // Check if debug mode is enabled in localStorage
    const localStorageDebugMode = localStorage.getItem('debugMode') === 'true';

    return isDevelopment || urlDebugMode || localStorageDebugMode;
}

/**
 * Logs a shot registration event to Firestore
 * NOTE: Only runs in development mode or when debug mode is explicitly enabled
 * @param {Object} eventData - The event data to log
 * @param {string} eventData.eventType - Type of event (e.g., 'goal', 'save', 'miss')
 * @param {Object} eventData.player - Player who took the shot or made the save
 * @param {Object} eventData.keeper - Active keeper (for defense mode)
 * @param {string} eventData.result - Result of the shot
 * @param {Object} eventData.position - Position where shot was taken/landed
 * @param {string} eventData.half - Which half (1 or 2)
 */
export async function logShotEvent(eventData) {
    // Skip detailed logging in production unless explicitly enabled
    if (!shouldLog()) {
        return;
    }
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
                isKeeper: eventData.player.isKeeper || false
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
 * NOTE: Only runs in development mode or when debug mode is explicitly enabled
 * @param {string} eventType - Type of event (e.g., 'match_started', 'match_finished', 'player_added')
 * @param {Object} data - Additional data to log
 */
export async function logAppEvent(eventType, data = {}) {
    // Skip detailed logging in production unless explicitly enabled
    if (!shouldLog()) {
        return;
    }

    try {
        const user = auth.currentUser;
        if (!user) {
return;
}

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
 * Logs critical errors - ALWAYS runs, even in production
 * Use this for catching and tracking unexpected errors that need investigation
 * @param {Error} error - The error object
 * @param {Object} context - Additional context about where/when the error occurred
 */
export async function logError(error, context = {}) {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.error('❌ Error occurred but no user to log it:', error);
            return;
        }

        const errorEntry = {
            clientTimestamp: new Date().toISOString(),
            serverTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
            errorMessage: error.message || String(error),
            errorStack: error.stack || null,
            context: context,
            userAgent: navigator.userAgent,
            url: window.location.href,
            userId: user.uid
        };

        await db.collection('users')
            .doc(user.uid)
            .collection('errors')
            .add(errorEntry);

        console.error('❌ Error logged to Firestore:', error);

    } catch (loggingError) {
        // Don't let logging errors break the app
        console.error('❌ Failed to log error to Firestore:', loggingError);
    }
}

/**
 * Enables debug mode for the current session
 * This allows detailed logging even in production
 */
export function enableDebugMode() {
    localStorage.setItem('debugMode', 'true');
    console.log('🐛 Debug mode ENABLED - Detailed logging is now active');
    console.log('ℹ️ To disable: localStorage.removeItem("debugMode") or call disableDebugMode()');
}

/**
 * Disables debug mode
 */
export function disableDebugMode() {
    localStorage.removeItem('debugMode');
    console.log('✅ Debug mode DISABLED - Logging is now production-safe');
}

/**
 * Checks if debug mode is currently active
 * @returns {boolean}
 */
export function isDebugModeEnabled() {
    return shouldLog();
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
        if (!user) {
return;
}

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
