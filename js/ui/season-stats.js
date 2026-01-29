// ============================================
// SEASON STATISTICS PAGE RENDERING
// ============================================
import { APP } from '../state.js';
import { calculateSeasonStats } from '../season-statistics.js';

/**
 * Render season statistics page
 */
export function renderSeasonStatsPage() {
  const season = APP.viewingSeason;
  if (!season) {
    return `
            <div class="container">
                <div class="card">
                    <h1>⚠️ Ingen sesong valgt</h1>
                    <button class="btn btn-primary" data-action="viewSeasons">
                        ← Tilbake til sesonger
                    </button>
                </div>
            </div>
        `;
  }

  const stats = calculateSeasonStats(season.id);
  if (!stats) {
    return `
            <div class="container">
                <div class="card">
                    <h1>⚠️ Feil ved lasting av statistikk</h1>
                    <button class="btn btn-primary" data-action="viewSeasons">
                        ← Tilbake til sesonger
                    </button>
                </div>
            </div>
        `;
  }

  return `
        <div class="container">
            <!-- Header -->
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                    <h1 style="font-size: 2rem; font-weight: 700; color: #312e81; margin: 0;">
                        📊 ${stats.seasonName}
                    </h1>
                    <button class="btn btn-secondary" data-action="viewSeasons" style="padding: 0.5rem 1rem;">
                        ← Tilbake til sesonger
                    </button>
                </div>
                <p style="color: #6b7280; margin-top: 0.5rem;">
                    ${stats.matchCount} ${stats.matchCount === 1 ? 'kamp' : 'kamper'} spilt
                </p>
            </div>

            ${stats.matchCount === 0 ? renderEmptySeasonMessage() : renderSeasonStats(stats)}
        </div>
    `;
}

/**
 * Render message for empty season
 */
function renderEmptySeasonMessage() {
  return `
        <div class="card">
            <div style="text-align: center; padding: 3rem 1rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">📭</div>
                <h2 style="color: #6b7280; font-weight: 600; margin-bottom: 0.5rem;">
                    Ingen kamper i denne sesongen ennå
                </h2>
                <p style="color: #9ca3af;">
                    Legg til kamper i sesongadministrasjonen for å se statistikk
                </p>
            </div>
        </div>
    `;
}

/**
 * Render full season statistics
 */
function renderSeasonStats(stats) {
  return `
        <!-- Key Metrics Dashboard -->
        ${renderKeyMetrics(stats)}

        <!-- Goals Timeline Chart -->
        ${renderGoalsTimeline(stats)}

        <!-- Top Scorers and Assisters -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
            ${renderTopScorers(stats)}
            ${renderTopAssisters(stats)}
        </div>

        <!-- Best and Worst Matches -->
        ${renderBestWorstMatches(stats)}

        <!-- Goalkeeper Statistics -->
        ${renderKeeperStats(stats)}

        <!-- Tactical Analysis -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
            ${renderAttackTypeEfficiency(stats)}
            ${renderShotPositionEfficiency(stats)}
        </div>
    `;
}

/**
 * Render key metrics dashboard
 */
function renderKeyMetrics(stats) {
  const metrics = [
    {
      label: 'Totalt mål',
      value: stats.totalGoals,
      icon: '⚽',
      color: '#10b981',
    },
    {
      label: 'Mål imot',
      value: stats.totalGoalsAgainst,
      icon: '🥅',
      color: '#ef4444',
    },
    {
      label: 'Målforskjell',
      value: stats.goalDifference > 0 ? `+${stats.goalDifference}` : stats.goalDifference,
      icon: stats.goalDifference >= 0 ? '📈' : '📉',
      color: stats.goalDifference >= 0 ? '#10b981' : '#ef4444',
    },
    {
      label: 'Snitt mål/kamp',
      value: stats.averageGoalsPerMatch.toFixed(1),
      icon: '🎯',
      color: '#3b82f6',
    },
    {
      label: 'Skuddeffektivitet',
      value: `${stats.shootingEfficiency.toFixed(0)}%`,
      icon: '📊',
      color: '#8b5cf6',
    },
    {
      label: 'Tekniske feil',
      value: stats.totalTechnicalErrors,
      icon: '⚠️',
      color: '#f59e0b',
    },
  ];

  return `
        <div class="card">
            <h2 style="font-size: 1.5rem; font-weight: 700; color: #312e81; margin-bottom: 1.5rem;">
                🎯 Nøkkeltall
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                ${metrics
                  .map(
                    (metric) => `
                    <div style="padding: 1rem; background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%); border-radius: 8px; border: 1px solid #e5e7eb; text-align: center;">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">${metric.icon}</div>
                        <div style="font-size: 2rem; font-weight: 700; color: ${metric.color}; margin-bottom: 0.25rem;">
                            ${metric.value}
                        </div>
                        <div style="font-size: 0.875rem; color: #6b7280; font-weight: 500;">
                            ${metric.label}
                        </div>
                    </div>
                `
                  )
                  .join('')}
            </div>
        </div>
    `;
}

/**
 * Render goals timeline chart
 */
function renderGoalsTimeline(stats) {
  const seasonMatchIds = APP.viewingSeason.matches || [];
  const matches = APP.completedMatches
    .filter((m) => seasonMatchIds.includes(m.id))
    .sort((a, b) => new Date(a.matchDate) - new Date(b.matchDate));

  if (matches.length === 0) {
    return '';
  }

  const matchGoals = matches.map((match) => {
    const events = match.events || [];
    const goalsFor = events.filter((e) => e.mode === 'attack' && e.result === 'mål').length;
    const goalsAgainst = events.filter((e) => e.mode === 'defense' && e.result === 'mål').length;
    return { goalsFor, goalsAgainst, date: match.matchDate };
  });

  const maxGoals = Math.max(...matchGoals.map((m) => Math.max(m.goalsFor, m.goalsAgainst)), 1);

  return `
        <div class="card">
            <h2 style="font-size: 1.5rem; font-weight: 700; color: #312e81; margin-bottom: 1.5rem;">
                📈 Måloversikt per kamp
            </h2>
            <div style="overflow-x: auto;">
                <div style="min-width: ${matches.length * 80}px; padding: 1rem 0;">
                    ${matchGoals
                      .map(
                        (match, index) => `
                        <div style="display: inline-block; width: 80px; vertical-align: bottom; text-align: center; margin-right: ${index < matchGoals.length - 1 ? '10px' : '0'};">
                            <!-- Goals For Bar -->
                            <div style="height: 150px; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; margin-bottom: 0.5rem;">
                                <div style="width: 30px; background: linear-gradient(to top, #10b981, #34d399); border-radius: 4px 4px 0 0; height: ${(match.goalsFor / maxGoals) * 150}px; min-height: ${match.goalsFor > 0 ? '3px' : '0'}; position: relative;">
                                    <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 0.875rem; font-weight: 600; color: #10b981;">
                                        ${match.goalsFor}
                                    </div>
                                </div>
                            </div>
                            <!-- Goals Against Bar -->
                            <div style="height: 150px; display: flex; flex-direction: column; justify-content: flex-start; align-items: center; margin-bottom: 0.5rem;">
                                <div style="width: 30px; background: linear-gradient(to bottom, #ef4444, #f87171); border-radius: 0 0 4px 4px; height: ${(match.goalsAgainst / maxGoals) * 150}px; min-height: ${match.goalsAgainst > 0 ? '3px' : '0'}; position: relative;">
                                    <div style="position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%); font-size: 0.875rem; font-weight: 600; color: #ef4444;">
                                        ${match.goalsAgainst}
                                    </div>
                                </div>
                            </div>
                            <!-- Match number -->
                            <div style="font-size: 0.75rem; color: #6b7280; font-weight: 500; margin-top: 0.5rem;">
                                Kamp ${index + 1}
                            </div>
                        </div>
                    `
                      )
                      .join('')}
                </div>
                <div style="display: flex; justify-content: center; gap: 2rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 20px; height: 20px; background: linear-gradient(to top, #10b981, #34d399); border-radius: 4px;"></div>
                        <span style="font-size: 0.875rem; color: #6b7280;">Mål for</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 20px; height: 20px; background: linear-gradient(to bottom, #ef4444, #f87171); border-radius: 4px;"></div>
                        <span style="font-size: 0.875rem; color: #6b7280;">Mål imot</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render top scorers table
 */
function renderTopScorers(stats) {
  if (stats.topScorers.length === 0) {
    return `
            <div class="card">
                <h2 style="font-size: 1.5rem; font-weight: 700; color: #312e81; margin-bottom: 1rem;">
                    👟 Toppscorere
                </h2>
                <p style="color: #6b7280; text-align: center; padding: 2rem;">
                    Ingen mål scoret ennå
                </p>
            </div>
        `;
  }

  return `
        <div class="card">
            <h2 style="font-size: 1.5rem; font-weight: 700; color: #312e81; margin-bottom: 1rem;">
                👟 Toppscorere
            </h2>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 2px solid #e5e7eb;">
                            <th style="text-align: left; padding: 0.75rem; font-size: 0.875rem; color: #6b7280; font-weight: 600;">#</th>
                            <th style="text-align: left; padding: 0.75rem; font-size: 0.875rem; color: #6b7280; font-weight: 600;">Spiller</th>
                            <th style="text-align: center; padding: 0.75rem; font-size: 0.875rem; color: #6b7280; font-weight: 600;">Mål</th>
                            <th style="text-align: center; padding: 0.75rem; font-size: 0.875rem; color: #6b7280; font-weight: 600;">Kamper</th>
                            <th style="text-align: center; padding: 0.75rem; font-size: 0.875rem; color: #6b7280; font-weight: 600;">Snitt</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${stats.topScorers
                          .map(
                            (scorer, index) => `
                            <tr style="border-bottom: 1px solid #f3f4f6; ${index === 0 ? 'background: linear-gradient(to right, #fef3c7, #ffffff);' : ''}">
                                <td style="padding: 0.75rem; font-size: 1.25rem;">
                                    ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                                </td>
                                <td style="padding: 0.75rem; font-weight: 600; color: #312e81;">
                                    ${scorer.playerName}
                                </td>
                                <td style="padding: 0.75rem; text-align: center; font-weight: 700; color: #10b981; font-size: 1.125rem;">
                                    ${scorer.goals}
                                </td>
                                <td style="padding: 0.75rem; text-align: center; color: #6b7280;">
                                    ${scorer.matches}
                                </td>
                                <td style="padding: 0.75rem; text-align: center; color: #6b7280;">
                                    ${scorer.goalsPerMatch.toFixed(1)}
                                </td>
                            </tr>
                        `
                          )
                          .join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

/**
 * Render top assisters table
 */
function renderTopAssisters(stats) {
  if (stats.topAssisters.length === 0) {
    return `
            <div class="card">
                <h2 style="font-size: 1.5rem; font-weight: 700; color: #312e81; margin-bottom: 1rem;">
                    🤝 Topp assistere
                </h2>
                <p style="color: #6b7280; text-align: center; padding: 2rem;">
                    Ingen assist registrert ennå
                </p>
            </div>
        `;
  }

  return `
        <div class="card">
            <h2 style="font-size: 1.5rem; font-weight: 700; color: #312e81; margin-bottom: 1rem;">
                🤝 Topp assistere
            </h2>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 2px solid #e5e7eb;">
                            <th style="text-align: left; padding: 0.75rem; font-size: 0.875rem; color: #6b7280; font-weight: 600;">#</th>
                            <th style="text-align: left; padding: 0.75rem; font-size: 0.875rem; color: #6b7280; font-weight: 600;">Spiller</th>
                            <th style="text-align: center; padding: 0.75rem; font-size: 0.875rem; color: #6b7280; font-weight: 600;">Assist</th>
                            <th style="text-align: center; padding: 0.75rem; font-size: 0.875rem; color: #6b7280; font-weight: 600;">Kamper</th>
                            <th style="text-align: center; padding: 0.75rem; font-size: 0.875rem; color: #6b7280; font-weight: 600;">Snitt</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${stats.topAssisters
                          .map(
                            (assister, index) => `
                            <tr style="border-bottom: 1px solid #f3f4f6; ${index === 0 ? 'background: linear-gradient(to right, #dbeafe, #ffffff);' : ''}">
                                <td style="padding: 0.75rem; font-size: 1.25rem;">
                                    ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                                </td>
                                <td style="padding: 0.75rem; font-weight: 600; color: #312e81;">
                                    ${assister.playerName}
                                </td>
                                <td style="padding: 0.75rem; text-align: center; font-weight: 700; color: #3b82f6; font-size: 1.125rem;">
                                    ${assister.assists}
                                </td>
                                <td style="padding: 0.75rem; text-align: center; color: #6b7280;">
                                    ${assister.matches}
                                </td>
                                <td style="padding: 0.75rem; text-align: center; color: #6b7280;">
                                    ${assister.assistsPerMatch.toFixed(1)}
                                </td>
                            </tr>
                        `
                          )
                          .join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

/**
 * Render best and worst matches
 */
function renderBestWorstMatches(stats) {
  if (!stats.bestMatch && !stats.worstMatch) {
    return '';
  }

  return `
        <div class="card">
            <h2 style="font-size: 1.5rem; font-weight: 700; color: #312e81; margin-bottom: 1.5rem;">
                🏆 Beste og verste kamp
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
                ${
                  stats.bestMatch
                    ? `
                    <div style="padding: 1.5rem; background: linear-gradient(135deg, #d1fae5 0%, #ffffff 100%); border-radius: 8px; border: 2px solid #10b981;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                            <span style="font-size: 2rem;">🏆</span>
                            <h3 style="font-size: 1.125rem; font-weight: 700; color: #065f46; margin: 0;">
                                Beste kamp
                            </h3>
                        </div>
                        <div style="font-size: 1.125rem; font-weight: 600; color: #312e81; margin-bottom: 0.5rem;">
                            vs ${stats.bestMatch.opponent}
                        </div>
                        <div style="font-size: 2rem; font-weight: 700; color: #10b981; margin-bottom: 0.5rem;">
                            ${stats.bestMatch.goalsFor} - ${stats.bestMatch.goalsAgainst}
                        </div>
                        <div style="font-size: 0.875rem; color: #6b7280;">
                            ${new Date(stats.bestMatch.date).toLocaleDateString('nb-NO', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                    </div>
                `
                    : ''
                }
                ${
                  stats.worstMatch
                    ? `
                    <div style="padding: 1.5rem; background: linear-gradient(135deg, #fee2e2 0%, #ffffff 100%); border-radius: 8px; border: 2px solid #ef4444;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                            <span style="font-size: 2rem;">📉</span>
                            <h3 style="font-size: 1.125rem; font-weight: 700; color: #991b1b; margin: 0;">
                                Vanskeligste kamp
                            </h3>
                        </div>
                        <div style="font-size: 1.125rem; font-weight: 600; color: #312e81; margin-bottom: 0.5rem;">
                            vs ${stats.worstMatch.opponent}
                        </div>
                        <div style="font-size: 2rem; font-weight: 700; color: #ef4444; margin-bottom: 0.5rem;">
                            ${stats.worstMatch.goalsFor} - ${stats.worstMatch.goalsAgainst}
                        </div>
                        <div style="font-size: 0.875rem; color: #6b7280;">
                            ${new Date(stats.worstMatch.date).toLocaleDateString('nb-NO', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                    </div>
                `
                    : ''
                }
            </div>
        </div>
    `;
}

/**
 * Render goalkeeper statistics
 */
function renderKeeperStats(stats) {
  if (stats.keeperStats.length === 0) {
    return '';
  }

  return `
        <div class="card">
            <h2 style="font-size: 1.5rem; font-weight: 700; color: #312e81; margin-bottom: 1rem;">
                🧤 Keeperstatistikk
            </h2>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 2px solid #e5e7eb;">
                            <th style="text-align: left; padding: 0.75rem; font-size: 0.875rem; color: #6b7280; font-weight: 600;">Keeper</th>
                            <th style="text-align: center; padding: 0.75rem; font-size: 0.875rem; color: #6b7280; font-weight: 600;">Redninger</th>
                            <th style="text-align: center; padding: 0.75rem; font-size: 0.875rem; color: #6b7280; font-weight: 600;">Skudd mot</th>
                            <th style="text-align: center; padding: 0.75rem; font-size: 0.875rem; color: #6b7280; font-weight: 600;">Redning%</th>
                            <th style="text-align: center; padding: 0.75rem; font-size: 0.875rem; color: #6b7280; font-weight: 600;">Kamper</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${stats.keeperStats
                          .map(
                            (keeper) => `
                            <tr style="border-bottom: 1px solid #f3f4f6;">
                                <td style="padding: 0.75rem; font-weight: 600; color: #312e81;">
                                    ${keeper.keeperName}
                                </td>
                                <td style="padding: 0.75rem; text-align: center; font-weight: 700; color: #10b981;">
                                    ${keeper.saves}
                                </td>
                                <td style="padding: 0.75rem; text-align: center; color: #6b7280;">
                                    ${keeper.shots}
                                </td>
                                <td style="padding: 0.75rem; text-align: center; font-weight: 600; color: #3b82f6;">
                                    ${keeper.savePercentage.toFixed(0)}%
                                </td>
                                <td style="padding: 0.75rem; text-align: center; color: #6b7280;">
                                    ${keeper.matches}
                                </td>
                            </tr>
                        `
                          )
                          .join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

/**
 * Render attack type efficiency
 */
function renderAttackTypeEfficiency(stats) {
  const etablert = stats.attackTypes.etablert;
  const kontring = stats.attackTypes.kontring;

  return `
        <div class="card">
            <h2 style="font-size: 1.5rem; font-weight: 700; color: #312e81; margin-bottom: 1.5rem;">
                🎯 Angrepstypeeffektivitet
            </h2>
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                <!-- Etablert -->
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <span style="font-weight: 600; color: #312e81;">⚙️ Etablert angrep</span>
                        <span style="font-weight: 700; color: #3b82f6; font-size: 1.125rem;">
                            ${etablert.efficiency.toFixed(0)}%
                        </span>
                    </div>
                    <div style="width: 100%; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${etablert.efficiency}%; height: 100%; background: linear-gradient(to right, #3b82f6, #60a5fa); transition: width 0.3s;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 0.25rem;">
                        <span style="font-size: 0.875rem; color: #6b7280;">${etablert.goals} mål</span>
                        <span style="font-size: 0.875rem; color: #6b7280;">${etablert.shots} skudd</span>
                    </div>
                </div>
                <!-- Kontring -->
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <span style="font-weight: 600; color: #312e81;">⚡ Kontring</span>
                        <span style="font-weight: 700; color: #10b981; font-size: 1.125rem;">
                            ${kontring.efficiency.toFixed(0)}%
                        </span>
                    </div>
                    <div style="width: 100%; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${kontring.efficiency}%; height: 100%; background: linear-gradient(to right, #10b981, #34d399); transition: width 0.3s;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 0.25rem;">
                        <span style="font-size: 0.875rem; color: #6b7280;">${kontring.goals} mål</span>
                        <span style="font-size: 0.875rem; color: #6b7280;">${kontring.shots} skudd</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render shot position efficiency
 */
function renderShotPositionEfficiency(stats) {
  const positions = [
    { key: '9m', label: '9 meter', icon: '🎯' },
    { key: '6m', label: '6 meter', icon: '💥' },
    { key: '7m', label: '7 meter (straffe)', icon: '🎪' },
    { key: 'ka', label: 'Kontring', icon: '⚡' },
  ];

  return `
        <div class="card">
            <h2 style="font-size: 1.5rem; font-weight: 700; color: #312e81; margin-bottom: 1.5rem;">
                📍 Skuddposisjonseffektivitet
            </h2>
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                ${positions
                  .map((pos) => {
                    const data = stats.shotPositions[pos.key];
                    return `
                        <div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                <span style="font-weight: 600; color: #312e81;">
                                    ${pos.icon} ${pos.label}
                                </span>
                                <span style="font-weight: 700; color: #8b5cf6; font-size: 1.125rem;">
                                    ${data.efficiency.toFixed(0)}%
                                </span>
                            </div>
                            <div style="width: 100%; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
                                <div style="width: ${data.efficiency}%; height: 100%; background: linear-gradient(to right, #8b5cf6, #a78bfa); transition: width 0.3s;"></div>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-top: 0.25rem;">
                                <span style="font-size: 0.875rem; color: #6b7280;">${data.goals} mål</span>
                                <span style="font-size: 0.875rem; color: #6b7280;">${data.shots} skudd</span>
                            </div>
                        </div>
                    `;
                  })
                  .join('')}
            </div>
        </div>
    `;
}
