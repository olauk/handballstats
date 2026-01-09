// ============================================
// MODAL MANAGEMENT
// ============================================
import { APP, getCurrentEvents, getCurrentPlayers, getCurrentOpponents } from '../state.js';
import { renderShotPopupContent, renderTechnicalPopupContent } from '../shots.js';
import { renderPlayersManagementPopupContent } from '../players.js';
import { renderTeamRosterEditModalContent } from './team-roster.js';

export function showModal(modalId) {
    setTimeout(() => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
        }
    }, 0);
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

export function showPlayerShotDetails(playerId, isOpponent = false) {
    const players = isOpponent ? getCurrentOpponents() : getCurrentPlayers();
    const player = players.find(p => p.id === playerId);

    if (!player) return;

    const events = getCurrentEvents();
    const playerShots = events.filter(e => {
        if (isOpponent) {
            return e.opponent?.id === playerId && e.mode === 'defense';
        } else {
            return e.player?.id === playerId && e.mode === 'attack';
        }
    });

    APP.shotDetailsData = {
        player,
        shots: playerShots,
        isOpponent
    };

    // Oppdater modal-innhold FØRST
    updateShotDetailsModal();
    // Deretter vis modalen
    showModal('shotDetailsPopup');
}

export function showKeeperShotDetails(keeperId) {
    const players = getCurrentPlayers();
    const keeper = players.find(p => p.id === keeperId);
    if (!keeper) return;

    const events = getCurrentEvents();
    const keeperShots = events.filter(e =>
        e.keeper?.id === keeperId && e.mode === 'defense'
    );

    APP.shotDetailsData = {
        player: keeper,
        shots: keeperShots,
        isKeeper: true
    };

    // Oppdater modal-innhold FØRST
    updateShotDetailsModal();
    // Deretter vis modalen
    showModal('shotDetailsPopup');
}

// Ny funksjon for å oppdatere shotDetails modal uten full re-render
export function updateShotDetailsModal() {
    const modal = document.getElementById('shotDetailsPopup');
    if (!modal) {
        // Modal eksisterer ikke ennå, den vil bli lastet på neste render
        console.warn('shotDetailsPopup modal not found in DOM');
        return;
    }

    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        if (APP.shotDetailsData) {
            modalContent.innerHTML = renderShotDetailsPopupContent();
        } else {
            console.warn('No shotDetailsData available');
        }
    }
}

// Separer innholdet i shotDetails modal
export function renderShotDetailsPopupContent() {
    if (!APP.shotDetailsData) return '';

    const { player, shots, isOpponent, isKeeper } = APP.shotDetailsData;
    const goals = shots.filter(s => s.result === 'mål').length;
    const saves = shots.filter(s => s.result === 'redning').length;
    const outside = shots.filter(s => s.result === 'utenfor').length;
    const shootingPercent = shots.length > 0 ? ((goals / shots.length) * 100).toFixed(1) : 0;

    // Separate shots by zone for rendering
    const goalShots = shots.filter(s => s.zone === 'goal');
    const outsideShots = shots.filter(s => s.zone === 'outside');

    const goalShotMarkers = goalShots.map(shot => {
        const playerNumber = isKeeper ? shot.opponent?.number : isOpponent ? shot.opponent?.number : shot.player?.number;
        const className = shot.result === 'mål' ? 'goal' : 'save';
        return `
            <div class="shot-marker ${className}"
                 style="left: ${shot.x}%; top: ${shot.y}%;"
                 title="${shot.result} - ${shot.timestamp}">
                ${playerNumber}
            </div>
        `;
    }).join('');

    const outsideShotMarkers = outsideShots.map(shot => {
        const playerNumber = isKeeper ? shot.opponent?.number : isOpponent ? shot.opponent?.number : shot.player?.number;
        return `
            <div class="shot-marker outside"
                 style="left: ${shot.x}%; top: ${shot.y}%; position: absolute;"
                 title="${shot.result} - ${shot.timestamp}">
                ${playerNumber}
            </div>
        `;
    }).join('');

    return `
        <div class="modal-header" style="position: sticky; top: 0; background: white; z-index: 10;">
            <h2 style="font-size: 1.5rem; font-weight: 700; color: #312e81;">
                ${isKeeper
                    ? `Keeper ${player.name} (#${player.number}) - Mottatte skudd`
                    : `${player.name} (#${player.number}) - Skudd`}
            </h2>
            <button class="btn btn-secondary" data-action="closeShotDetails">
                Lukk
            </button>
        </div>

        ${shots.length === 0 ? `
            <p style="text-align: center; color: #4b5563; padding: 2rem;">Ingen skudd registrert</p>
        ` : `
            <div class="stats-grid mb-6">
                <div class="stat-card green">
                    <div class="stat-value green">${goals}</div>
                    <div class="stat-label">Mål</div>
                </div>
                <div class="stat-card amber">
                    <div class="stat-value amber">${saves}</div>
                    <div class="stat-label">Redninger</div>
                </div>
                <div class="stat-card gray">
                    <div class="stat-value gray">${outside}</div>
                    <div class="stat-label">Utenfor</div>
                </div>
                <div class="stat-card blue">
                    <div class="stat-value blue">${shots.length}</div>
                    <div class="stat-label">Totalt skudd</div>
                </div>
                <div class="stat-card purple">
                    <div class="stat-value purple">${shootingPercent}%</div>
                    <div class="stat-label">${isKeeper ? 'Innsluppsprosent' : 'Uttelling'}</div>
                </div>
            </div>

            <div class="goal-container" style="padding-top: 3rem; padding-left: 3rem; padding-right: 3rem; cursor: default; position: relative;">
                ${outsideShotMarkers}
                <div class="goal" style="cursor: default;">
                    <div class="goal-grid">
                        ${[...Array(6)].map(() => '<div class="goal-grid-cell"></div>').join('')}
                    </div>
                    ${goalShotMarkers}
                </div>
            </div>

            <div class="legend mt-4">
                <div class="legend-item">
                    <div class="legend-color green"></div>
                    <span style="font-weight: 500;">Mål</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color amber"></div>
                    <span style="font-weight: 500;">Redning</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color gray"></div>
                    <span style="font-weight: 500;">Utenfor</span>
                </div>
            </div>
        `}
    `;
}

export function updatePlayersManagementModal() {
    const modal = document.getElementById('playersManagementPopup');
    if (!modal) return;

    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.innerHTML = renderPlayersManagementPopupContent();
    }
}

export function updateTeamRosterEditModal() {
    const modal = document.getElementById('teamRosterEditModal');
    if (!modal) return;

    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.innerHTML = renderTeamRosterEditModalContent();
    }
}

// Optimalisert funksjon for å kun oppdatere statistikk-seksjonen
export function updateStatisticsOnly(renderStatistics, attachStatisticsEventListeners) {
    // Finn statistikk-kortet (siste .card element som inneholder statistikk)
    const allCards = document.querySelectorAll('.card');
    let statsCard = null;

    // Finn kortet med "Statistikk" overskrift
    allCards.forEach(card => {
        const heading = card.querySelector('h2');
        if (heading && heading.textContent.includes('Statistikk')) {
            statsCard = card;
        }
    });

    if (!statsCard) return;

    // Opprett nytt statistikk-innhold
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = renderStatistics();
    const newStatsCard = tempDiv.firstElementChild;

    // Erstatt gammelt kort med nytt
    statsCard.parentNode.replaceChild(newStatsCard, statsCard);

    // Re-attach event listeners for knappene i statistikk-tabellen
    attachStatisticsEventListeners();
}

// Funksjon for å kun re-attachе event listeners for statistikk-seksjonen
export function attachStatisticsEventListeners() {
    // Event delegation håndterer allerede klikk, så denne er minimal
    // Men vi kan legge til spesifikke listeners her om nødvendig
}

// Lightweight function for modal buttons only - prevents re-attaching all listeners
export function attachModalEventListeners() {
    // This is called after updating modal content
    // Event delegation handles the rest, so this is just a placeholder
    // The main event delegation in setupGlobalEventListeners() will catch modal clicks
}
