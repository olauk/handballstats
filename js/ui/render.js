// ============================================
// MAIN RENDER FUNCTIONS
// ============================================
import { APP } from '../state.js';
import { renderMatchPage } from './match.js';
import { renderSetupPage } from './setup.js';
import { renderHistoryPage, renderViewMatchPage } from './history.js';
import { renderHomePage } from './home.js';
import { renderTeamRosterPage } from './team-roster.js';
import { renderHelpPage } from './help.js';

export function render(attachEventListeners, renderFunction) {
  const app = document.getElementById('app');
  if (!app) {
    return;
  }

  console.log('🎨 Rendering page:', APP.page); // DEBUG

  // Authentication pages (login, register, reset-password)
  if (APP.page === 'login' || APP.page === 'register' || APP.page === 'reset-password') {
    console.log('→ Showing auth page for:', APP.page); // DEBUG
    app.innerHTML = renderLoginPage();
  } else if (APP.page === 'home') {
    app.innerHTML = renderHomePage();
  } else if (APP.page === 'welcome') {
    app.innerHTML = renderWelcomePage();
  } else if (APP.page === 'setup') {
    app.innerHTML = renderSetupPage();
  } else if (APP.page === 'history') {
    app.innerHTML = renderHistoryPage();
  } else if (APP.page === 'help') {
    app.innerHTML = renderHelpPage();
  } else if (APP.page === 'viewMatch') {
    app.innerHTML = renderViewMatchPage();
  } else if (APP.page === 'match') {
    console.log('→ Showing active match page'); // DEBUG
    app.innerHTML = renderMatchPage();
  } else if (APP.page === 'teamRoster') {
    app.innerHTML = renderTeamRosterPage();
  } else {
    console.warn('⚠️ Unknown page:', APP.page, '- defaulting to home page'); // DEBUG
    app.innerHTML = renderHomePage();
  }

  attachEventListeners(renderFunction);
}

export function renderLoginPage() {
  const showRegister = APP.page === 'register';
  const showReset = APP.page === 'reset-password';

  if (showRegister) {
    return renderRegisterPage();
  }

  if (showReset) {
    return renderPasswordResetPage();
  }

  return `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem;">
            <div class="card" style="max-width: 28rem; width: 100%;">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h1 style="font-size: 3rem; font-weight: 800; color: #312e81; margin-bottom: 0.5rem;">
                        Handball Analytics
                    </h1>
                    <p style="font-size: 1.125rem; color: #4b5563;">
                        Profesjonell kampstatistikk for håndball
                    </p>
                </div>

                <form id="loginForm" style="space-y: 1rem;">
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #374151;">
                            E-post
                        </label>
                        <input
                            type="email"
                            id="username"
                            name="username"
                            placeholder="din@epost.no"
                            required
                            autocomplete="email"
                            style="width: 100%; padding: 0.75rem; border: 2px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem;"
                        >
                    </div>

                    <div style="margin-top: 1rem;">
                        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #374151;">
                            Passord
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="Skriv inn passord"
                            required
                            autocomplete="current-password"
                            style="width: 100%; padding: 0.75rem; border: 2px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem;"
                        >
                    </div>

                    <button
                        type="submit"
                        class="btn btn-primary"
                        style="width: 100%; margin-top: 1.5rem; padding: 1rem; font-size: 1.125rem; font-weight: 700;">
                        Logg inn
                    </button>
                </form>

                <div style="margin-top: 1rem; text-align: center;">
                    <button class="btn btn-secondary" data-action="showRegister" style="width: 100%; margin-bottom: 0.5rem;">
                        Opprett ny bruker
                    </button>
                    <button class="btn btn-secondary" data-action="showPasswordReset" style="font-size: 0.875rem; padding: 0.5rem 1rem;">
                        Glemt passord?
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderRegisterPage() {
  return `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem;">
            <div class="card" style="max-width: 28rem; width: 100%;">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h1 style="font-size: 2.5rem; font-weight: 800; color: #312e81; margin-bottom: 0.5rem;">
                        Opprett bruker
                    </h1>
                    <p style="font-size: 1rem; color: #4b5563;">
                        Registrer deg for å lagre dine kamper i skyen
                    </p>
                </div>

                <form id="registerForm" style="space-y: 1rem;">
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #374151;">
                            Navn *
                        </label>
                        <input
                            type="text"
                            id="registerName"
                            placeholder="Ditt navn"
                            required
                            autocomplete="name"
                            style="width: 100%; padding: 0.75rem; border: 2px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem;"
                        >
                    </div>

                    <div style="margin-top: 1rem;">
                        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #374151;">
                            E-post *
                        </label>
                        <input
                            type="email"
                            id="registerEmail"
                            placeholder="din@epost.no"
                            required
                            autocomplete="email"
                            style="width: 100%; padding: 0.75rem; border: 2px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem;"
                        >
                    </div>

                    <div style="margin-top: 1rem;">
                        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #374151;">
                            Passord * (min 8 tegn)
                        </label>
                        <input
                            type="password"
                            id="registerPassword"
                            placeholder="Minst 8 tegn"
                            required
                            autocomplete="new-password"
                            minlength="6"
                            style="width: 100%; padding: 0.75rem; border: 2px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem;"
                        >
                    </div>

                    <div style="margin-top: 1rem;">
                        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #374151;">
                            Bekreft passord *
                        </label>
                        <input
                            type="password"
                            id="registerConfirmPassword"
                            placeholder="Skriv passord igjen"
                            required
                            autocomplete="new-password"
                            minlength="6"
                            style="width: 100%; padding: 0.75rem; border: 2px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem;"
                        >
                    </div>

                    <div style="margin-top: 1rem;">
                        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #374151;">
                            Eget lag (valgfritt)
                        </label>
                        <input
                            type="text"
                            id="registerHomeTeam"
                            placeholder="F.eks. Byåsen"
                            style="width: 100%; padding: 0.75rem; border: 2px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem;"
                        >
                    </div>

                    <button
                        type="submit"
                        class="btn btn-success"
                        style="width: 100%; margin-top: 1.5rem; padding: 1rem; font-size: 1.125rem; font-weight: 700;">
                        Opprett bruker
                    </button>
                </form>

                <div style="margin-top: 1rem; text-align: center;">
                    <button class="btn btn-secondary" data-action="showLogin" style="font-size: 0.875rem; padding: 0.5rem 1rem;">
                        Tilbake til innlogging
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderPasswordResetPage() {
  return `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem;">
            <div class="card" style="max-width: 28rem; width: 100%;">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h1 style="font-size: 2.5rem; font-weight: 800; color: #312e81; margin-bottom: 0.5rem;">
                        Tilbakestill passord
                    </h1>
                    <p style="font-size: 1rem; color: #4b5563;">
                        Skriv inn e-posten din, så sender vi deg en link
                    </p>
                </div>

                <form id="passwordResetForm" style="space-y: 1rem;">
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #374151;">
                            E-post
                        </label>
                        <input
                            type="email"
                            id="resetEmail"
                            placeholder="din@epost.no"
                            required
                            autocomplete="email"
                            style="width: 100%; padding: 0.75rem; border: 2px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem;"
                        >
                    </div>

                    <button
                        type="submit"
                        class="btn btn-primary"
                        style="width: 100%; margin-top: 1.5rem; padding: 1rem; font-size: 1.125rem; font-weight: 700;">
                        Send tilbakestillings-link
                    </button>
                </form>

                <div style="margin-top: 1rem; text-align: center;">
                    <button class="btn btn-secondary" data-action="showLogin" style="font-size: 0.875rem; padding: 0.5rem 1rem;">
                        Tilbake til innlogging
                    </button>
                </div>
            </div>
        </div>
    `;
}

export function renderWelcomePage() {
  const hasCompletedMatches = APP.completedMatches && APP.completedMatches.length > 0;

  return `
        <div class="container" style="max-width: 56rem; margin-top: 2rem;">
            <div class="card">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h1 style="font-size: 2.5rem; font-weight: 800; color: #312e81; margin-bottom: 0.5rem;">
                        Velkommen til Handball Analytics
                    </h1>
                    <p style="font-size: 1.125rem; color: #6b7280;">
                        Profesjonell kampstatistikk for håndball
                    </p>
                </div>

                <div style="margin-bottom: 2rem; padding: 1.5rem; background: #f3f4f6; border-radius: 0.5rem;">
                    <h2 style="font-size: 1.25rem; font-weight: 700; color: #312e81; margin-bottom: 1rem;">
                        Hva kan du gjøre med denne appen?
                    </h2>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        <li style="margin-bottom: 0.75rem; display: flex; align-items: start; gap: 0.5rem;">
                            <span style="color: #059669; font-size: 1.25rem;">⚽</span>
                            <span><strong>Registrer skudd:</strong> Klikk på målet der skuddet gikk, velg om det ble mål eller redning, og velg hvilken spiller som skjøt</span>
                        </li>
                        <li style="margin-bottom: 0.75rem; display: flex; align-items: start; gap: 0.5rem;">
                            <span style="color: #2563eb; font-size: 1.25rem;">🧤</span>
                            <span><strong>Keeperstatistikk:</strong> Registrer motstanderskudd og følg keepernes redningsprosent i sanntid</span>
                        </li>
                        <li style="margin-bottom: 0.75rem; display: flex; align-items: start; gap: 0.5rem;">
                            <span style="color: #dc2626; font-size: 1.25rem;">⚠️</span>
                            <span><strong>Tekniske feil:</strong> Registrer tekniske feil på dine spillere</span>
                        </li>
                        <li style="margin-bottom: 0.75rem; display: flex; align-items: start; gap: 0.5rem;">
                            <span style="color: #7c3aed; font-size: 1.25rem;">📊</span>
                            <span><strong>Detaljert statistikk:</strong> Se uttelling, mål per omgang, skuddkart og fullstendig kampstatistikk</span>
                        </li>
                        <li style="margin-bottom: 0.75rem; display: flex; align-items: start; gap: 0.5rem;">
                            <span style="color: #ea580c; font-size: 1.25rem;">💾</span>
                            <span><strong>Lagre kamper:</strong> Alle kamper lagres automatisk og kan ses på senere</span>
                        </li>
                        <li style="display: flex; align-items: start; gap: 0.5rem;">
                            <span style="color: #0891b2; font-size: 1.25rem;">📁</span>
                            <span><strong>Import/eksport:</strong> Last inn spillere fra fil eller eksporter kampdata til JSON</span>
                        </li>
                    </ul>
                </div>

                <div style="margin-bottom: 2rem; padding: 1.5rem; background: #eff6ff; border-radius: 0.5rem; border: 2px solid #3b82f6;">
                    <h2 style="font-size: 1.25rem; font-weight: 700; color: #1e40af; margin-bottom: 1rem;">
                        Slik kommer du i gang:
                    </h2>
                    <ol style="margin: 0; padding-left: 1.5rem; color: #1e40af;">
                        <li style="margin-bottom: 0.5rem;">Velg om du vil starte en ny kamp eller se tidligere kamper</li>
                        <li style="margin-bottom: 0.5rem;">For ny kamp: Legg inn lagnavn, dato og spillere</li>
                        <li style="margin-bottom: 0.5rem;">Start kampen og registrer skudd ved å klikke på målet</li>
                        <li style="margin-bottom: 0.5rem;">Bytt mellom angrep og forsvar etter behov</li>
                        <li>Avslutt kampen når den er ferdig - all data lagres automatisk</li>
                    </ol>
                </div>

                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    <button class="btn btn-success" data-action="startNewMatch"
                            style="flex: 1; min-width: 250px; padding: 1.5rem; font-size: 1.25rem; font-weight: 700;">
                        ⚽ Start ny kamp
                    </button>
                    ${
                      hasCompletedMatches
                        ? `
                        <button class="btn btn-blue" data-action="viewHistory"
                                style="flex: 1; min-width: 250px; padding: 1.5rem; font-size: 1.25rem; font-weight: 700;">
                            📋 Se tidligere kamper (${APP.completedMatches.length})
                        </button>
                    `
                        : `
                        <button class="btn btn-secondary" data-action="viewHistory"
                                style="flex: 1; min-width: 250px; padding: 1.5rem; font-size: 1.25rem; font-weight: 700;">
                            📋 Tidligere kamper
                        </button>
                    `
                    }
                </div>

                <div style="margin-top: 2rem; text-align: center;">
                    <button class="btn btn-secondary" data-action="logout">
                        Logg ut
                    </button>
                </div>
            </div>
        </div>
    `;
}
