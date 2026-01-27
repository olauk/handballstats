// ============================================
// SEASONS MANAGEMENT PAGE
// ============================================
import { APP } from '../state.js';

export function renderSeasonsPage() {
  // Separate active and ended seasons
  const activeSeasons = APP.seasons.filter((s) => !s.endDate);
  const endedSeasons = APP.seasons.filter((s) => s.endDate);

  // Helper function to format date
  const formatDate = (date) => {
    if (!date) {
      return '';
    }
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('nb-NO', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Helper function to get match count
  const getMatchCount = (season) => {
    const count = season.matches ? season.matches.length : 0;
    return count === 1 ? '1 kamp' : `${count} kamper`;
  };

  return `
        <div class="container">
            <div class="card">
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
                    <h1 style="font-size: 2.5rem; font-weight: 800; color: #312e81;">
                        📊 Sesonger
                    </h1>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <button class="btn btn-secondary" data-action="backToHome" style="padding: 0.5rem 1rem;">
                            ← Tilbake
                        </button>
                        <button class="btn btn-secondary" data-action="logout" style="padding: 0.5rem 1rem;">
                            Logg ut
                        </button>
                    </div>
                </div>

                <!-- Description -->
                <p style="color: #6b7280; margin-bottom: 2rem;">
                    Organiser kamper i sesonger for å få aggregert statistikk og analyse over tid.
                </p>

                <!-- Create New Season Button -->
                <div style="margin-bottom: 2rem;">
                    <button class="btn btn-primary" data-action="createNewSeason" style="padding: 1rem 2rem; font-weight: 700; font-size: 1.125rem;">
                        ➕ Opprett Ny Sesong
                    </button>
                </div>

                <!-- Active Seasons Section -->
                ${
                  activeSeasons.length > 0
                    ? `
                    <div style="margin-bottom: 3rem;">
                        <h2 style="font-size: 1.75rem; font-weight: 700; color: #312e81; margin-bottom: 1.5rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem;">
                            🟢 Aktive Sesonger
                        </h2>
                        <div style="display: grid; gap: 1.5rem;">
                            ${activeSeasons
                              .map(
                                (season) => `
                                <div style="border: 3px solid #10b981; border-radius: 12px; padding: 1.5rem; background: #f0fdf4;">
                                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
                                        <div style="flex: 1; min-width: 200px;">
                                            <h3 style="font-size: 1.5rem; font-weight: 700; color: #312e81; margin-bottom: 0.5rem;">
                                                ${season.name}
                                            </h3>
                                            <p style="color: #6b7280; font-size: 0.875rem;">
                                                Startet: ${formatDate(season.startDate)}
                                            </p>
                                            <p style="color: #059669; font-weight: 600; margin-top: 0.5rem;">
                                                ${getMatchCount(season)}
                                            </p>
                                        </div>
                                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                            <button class="btn btn-blue" data-action="viewSeason" data-season-id="${season.id}" style="padding: 0.75rem 1.5rem; font-weight: 600;">
                                                📈 Vis Statistikk
                                            </button>
                                            <button class="btn btn-secondary" data-action="manageSeason" data-season-id="${season.id}" style="padding: 0.75rem 1.5rem;">
                                                ⚙️ Administrer
                                            </button>
                                            <button class="btn btn-warning" data-action="endSeason" data-season-id="${season.id}" style="padding: 0.75rem 1.5rem;">
                                                🏁 Avslutt
                                            </button>
                                            <button class="btn btn-danger" data-action="deleteSeason" data-season-id="${season.id}" style="padding: 0.75rem 1.5rem;">
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `
                              )
                              .join('')}
                        </div>
                    </div>
                `
                    : `
                    <div style="text-align: center; padding: 3rem; background: #f9fafb; border-radius: 12px; border: 2px dashed #d1d5db; margin-bottom: 3rem;">
                        <p style="font-size: 1.25rem; color: #6b7280; margin-bottom: 1rem;">
                            📊 Ingen aktive sesonger
                        </p>
                        <p style="color: #9ca3af;">
                            Opprett en ny sesong for å komme i gang med sesongstatistikk
                        </p>
                    </div>
                `
                }

                <!-- Ended Seasons Section -->
                ${
                  endedSeasons.length > 0
                    ? `
                    <div>
                        <h2 style="font-size: 1.75rem; font-weight: 700; color: #312e81; margin-bottom: 1.5rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem;">
                            🔴 Avsluttede Sesonger
                        </h2>
                        <div style="display: grid; gap: 1.5rem;">
                            ${endedSeasons
                              .map(
                                (season) => `
                                <div style="border: 2px solid #e5e7eb; border-radius: 12px; padding: 1.5rem; background: white; opacity: 0.9;">
                                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
                                        <div style="flex: 1; min-width: 200px;">
                                            <h3 style="font-size: 1.5rem; font-weight: 700; color: #312e81; margin-bottom: 0.5rem;">
                                                ${season.name}
                                            </h3>
                                            <p style="color: #6b7280; font-size: 0.875rem;">
                                                ${formatDate(season.startDate)} - ${formatDate(season.endDate)}
                                            </p>
                                            <p style="color: #6b7280; font-weight: 600; margin-top: 0.5rem;">
                                                ${getMatchCount(season)}
                                            </p>
                                        </div>
                                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                            <button class="btn btn-blue" data-action="viewSeason" data-season-id="${season.id}" style="padding: 0.75rem 1.5rem; font-weight: 600;">
                                                📈 Vis Statistikk
                                            </button>
                                            <button class="btn btn-secondary" data-action="manageSeason" data-season-id="${season.id}" style="padding: 0.75rem 1.5rem;">
                                                ⚙️ Administrer
                                            </button>
                                            <button class="btn btn-danger" data-action="deleteSeason" data-season-id="${season.id}" style="padding: 0.75rem 1.5rem;">
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `
                              )
                              .join('')}
                        </div>
                    </div>
                `
                    : ''
                }
            </div>
        </div>

        ${renderSeasonManagementModal()}
    `;
}

/**
 * Render season management modal shell (empty container)
 */
export function renderSeasonManagementModal() {
  return `
        <div class="modal hidden" id="seasonManagementModal">
            <div class="modal-content" style="max-width: 700px;"></div>
        </div>
    `;
}

/**
 * Render season management modal content (for adding/removing matches)
 */
export function renderSeasonManagementModalContent() {
  const season = APP.viewingSeason;
  if (!season) {
    return '<p>Ingen sesong valgt</p>';
  }

  // Get available matches (completed matches not in this season)
  const seasonMatchIds = season.matches || [];
  const availableMatches = APP.completedMatches.filter((m) => !seasonMatchIds.includes(m.id));

  // Get matches in this season
  const seasonMatches = APP.completedMatches.filter((m) => seasonMatchIds.includes(m.id));

  const formatDate = (dateString) => {
    if (!dateString) {
      return '';
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('nb-NO', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h2 style="font-size: 1.75rem; font-weight: 700; color: #312e81;">
                ⚙️ Administrer Sesong: ${season.name}
            </h2>
            <button class="btn btn-secondary" data-action="closeSeasonManagement">
                ✕
            </button>
        </div>

        <!-- Matches in Season -->
        <div style="margin-bottom: 2rem;">
            <h3 style="font-size: 1.25rem; font-weight: 600; color: #312e81; margin-bottom: 1rem;">
                Kamper i sesongen (${seasonMatches.length})
            </h3>
            ${
              seasonMatches.length > 0
                ? `
                <div style="display: grid; gap: 0.75rem; max-height: 300px; overflow-y: auto; padding: 0.5rem;">
                    ${seasonMatches
                      .map(
                        (match) => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                            <div>
                                <div style="font-weight: 600; color: #312e81; margin-bottom: 0.25rem;">
                                    ${match.homeTeam} vs ${match.awayTeam}
                                </div>
                                <div style="font-size: 0.875rem; color: #6b7280;">
                                    ${formatDate(match.matchDate)}
                                </div>
                            </div>
                            <button class="btn btn-danger" data-action="removeMatchFromSeason" data-season-id="${season.id}" data-match-id="${match.id}" style="padding: 0.5rem 1rem;">
                                Fjern
                            </button>
                        </div>
                    `
                      )
                      .join('')}
                </div>
            `
                : `
                <div style="text-align: center; padding: 2rem; background: #f9fafb; border-radius: 8px; border: 1px dashed #d1d5db;">
                    <p style="color: #6b7280;">Ingen kamper i denne sesongen ennå</p>
                </div>
            `
            }
        </div>

        <!-- Available Matches to Add -->
        <div>
            <h3 style="font-size: 1.25rem; font-weight: 600; color: #312e81; margin-bottom: 1rem;">
                Tilgjengelige kamper (${availableMatches.length})
            </h3>
            ${
              availableMatches.length > 0
                ? `
                <div style="display: grid; gap: 0.75rem; max-height: 300px; overflow-y: auto; padding: 0.5rem;">
                    ${availableMatches
                      .map(
                        (match) => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: white; border-radius: 8px; border: 1px solid #e5e7eb;">
                            <div>
                                <div style="font-weight: 600; color: #312e81; margin-bottom: 0.25rem;">
                                    ${match.homeTeam} vs ${match.awayTeam}
                                </div>
                                <div style="font-size: 0.875rem; color: #6b7280;">
                                    ${formatDate(match.matchDate)}
                                </div>
                            </div>
                            <button class="btn btn-primary" data-action="addMatchToSeasonInModal" data-season-id="${season.id}" data-match-id="${match.id}" style="padding: 0.5rem 1rem;">
                                Legg til
                            </button>
                        </div>
                    `
                      )
                      .join('')}
                </div>
            `
                : `
                <div style="text-align: center; padding: 2rem; background: #f9fafb; border-radius: 8px; border: 1px dashed #d1d5db;">
                    <p style="color: #6b7280;">Alle kamper er allerede i sesonger</p>
                </div>
            `
            }
        </div>
    `;
}
