// ============================================
// EVENT FEED - LIVE HENDELSESLISTE
// ============================================
import { APP } from '../state.js';

/**
 * Renders the live event feed showing all match events with timestamps
 * Only shown in advanced mode
 * @returns {string} HTML string
 */
export function renderEventFeed() {
    if (APP.matchMode !== 'advanced') {
        return ''; // Don't show in simple mode
    }

    // Get all events sorted by time (oldest first for display)
    const events = [...APP.events].sort((a, b) => a.id - b.id);

    if (events.length === 0) {
        return `
            <div class="card" style="margin-top: 1.5rem;">
                <h3 style="font-size: 1.25rem; font-weight: 700; color: #312e81; margin-bottom: 1rem;">
                    📋 Hendelsesliste
                </h3>
                <div style="text-align: center; padding: 2rem; color: #6b7280;">
                    <p>Ingen hendelser registrert ennå</p>
                    <p style="font-size: 0.875rem; margin-top: 0.5rem;">
                        Hendelser vil vises her etter hvert som de registreres
                    </p>
                </div>
            </div>
        `;
    }

    // Calculate running score for each event
    let homeScore = 0;
    let awayScore = 0;

    const eventItems = events.map(event => {
        // Update score if it's a goal
        if (event.result === 'mål') {
            if (event.mode === 'attack') {
                homeScore++;
            } else if (event.mode === 'defense') {
                awayScore++;
            }
        }

        return formatEventItem(event, homeScore, awayScore);
    }).join('');

    return `
        <div class="card" style="margin-top: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="font-size: 1.25rem; font-weight: 700; color: #312e81; margin: 0;">
                    📋 Hendelsesliste
                </h3>
                <span style="font-size: 0.875rem; color: #6b7280;">
                    ${events.length} ${events.length === 1 ? 'hendelse' : 'hendelser'}
                </span>
            </div>

            <div id="eventFeed" style="max-height: 400px; overflow-y: auto; border: 2px solid #e5e7eb; border-radius: 8px; padding: 0.5rem; background: #f9fafb;">
                ${eventItems}
            </div>
        </div>
    `;
}

/**
 * Formats a single event item for the feed
 * @param {Object} event - The event to format
 * @param {number} homeScore - Home score at this point
 * @param {number} awayScore - Away score at this point
 * @returns {string} HTML string
 */
function formatEventItem(event, homeScore, awayScore) {
    // Get timer timestamp if available
    let timeString = '';
    if (event.timerTimestamp) {
        const min = String(event.timerTimestamp.minutes).padStart(2, '0');
        const sec = String(event.timerTimestamp.seconds).padStart(2, '0');
        timeString = `[${min}:${sec}]`;
    }

    // Get player info
    let playerInfo = '';
    let eventIcon = '';
    let eventColor = '#6b7280';

    if (event.mode === 'attack' && event.player) {
        playerInfo = `#${event.player.number} ${event.player.name}`;
    } else if (event.mode === 'defense' && event.opponent) {
        playerInfo = `#${event.opponent.number} ${event.opponent.name}`;
    } else if (event.mode === 'technical' && event.player) {
        playerInfo = `#${event.player.number} ${event.player.name}`;
    }

    // Set icon and color based on result
    switch (event.result) {
        case 'mål':
            eventIcon = '⚽';
            eventColor = '#059669';
            break;
        case 'redning':
            eventIcon = '🧤';
            eventColor = '#f59e0b';
            break;
        case 'utenfor':
            eventIcon = '📍';
            eventColor = '#6b7280';
            break;
        case 'teknisk feil':
            eventIcon = '⚠️';
            eventColor = '#dc2626';
            break;
        default:
            eventIcon = '•';
    }

    // Format score display (only for goals)
    let scoreDisplay = '';
    if (event.result === 'mål') {
        scoreDisplay = `<span style="font-weight: 700; color: #312e81;">(${homeScore}-${awayScore})</span>`;
    }

    // Determine if this is our team or opponent
    const isHomeTeam = event.mode === 'attack' || event.mode === 'technical';
    const teamLabel = isHomeTeam ? APP.homeTeam : APP.awayTeam;

    return `
        <div class="event-item" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; margin-bottom: 0.5rem; background: white; border-radius: 6px; border-left: 4px solid ${eventColor}; transition: all 0.2s;">
            <div style="font-size: 1.5rem; line-height: 1;">${eventIcon}</div>
            <div style="flex: 1; min-width: 0;">
                <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                    ${timeString ? `<span style="font-family: 'Courier New', monospace; font-weight: 700; color: #6b7280; font-size: 0.875rem;">${timeString}</span>` : ''}
                    <span style="font-weight: 600; color: ${eventColor}; text-transform: capitalize;">${event.result}</span>
                    <span style="color: #9ca3af;">•</span>
                    <span style="color: #4b5563;">${playerInfo}</span>
                    ${scoreDisplay}
                </div>
                <div style="font-size: 0.75rem; color: #9ca3af; margin-top: 0.25rem;">
                    ${teamLabel} • ${event.half}. omgang
                </div>
            </div>
        </div>
    `;
}

/**
 * Updates the event feed without re-rendering the entire page
 */
export function updateEventFeed() {
    if (APP.matchMode !== 'advanced') {
        return; // Don't update in simple mode
    }

    // Find the event feed container
    const eventFeedContainer = document.querySelector('#eventFeed');
    if (!eventFeedContainer) {
        return; // Event feed not in DOM yet
    }

    const parentCard = eventFeedContainer.closest('.card');
    if (!parentCard) return;

    // Re-render the entire event feed card
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = renderEventFeed();
    const newCard = tempDiv.firstElementChild;

    if (newCard && parentCard.parentNode) {
        parentCard.parentNode.replaceChild(newCard, parentCard);
        scrollEventFeedToBottom();
    }
}

/**
 * Scrolls the event feed to the bottom (most recent event)
 */
export function scrollEventFeedToBottom() {
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
        const eventFeed = document.getElementById('eventFeed');
        if (eventFeed) {
            eventFeed.scrollTop = eventFeed.scrollHeight;
        }
    });
}
