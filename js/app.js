// ============================================
// HANDBALL ANALYTICS - MAIN ENTRY POINT
// ============================================
import { loadFromLocalStorage } from './storage.js';
import { render as renderApp } from './ui/render.js';
import { setupGlobalEventListeners, attachEventListeners } from './events.js';
import { initAuthStateObserver } from './auth.js';

// Export render function for use in events
export function render() {
    renderApp(attachEventListeners, render);
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    setupGlobalEventListeners(render); // Setup global event delegation ONCE
    initAuthStateObserver(render); // Initialize Firebase auth state observer
    render();
});
