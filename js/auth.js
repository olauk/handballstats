// ============================================
// LOGIN & AUTH WITH FIREBASE
// ============================================
import { APP, PERFORMANCE } from './state.js';
import { saveToLocalStorageImmediate } from './storage.js';
import { auth, db } from './firebase-config.js';
import { migrateLocalStorageToFirestore, syncFromFirestore } from './firestore-storage.js';

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {string|null} Error message or null if valid
 */
export function validateEmail(email) {
    if (!email || email.trim().length === 0) {
        return 'E-postadresse er påkrevd';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return 'Ugyldig e-postadresse';
    }

    return null;
}

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {string[]} Array of error messages (empty if valid)
 */
export function validatePassword(password) {
    const errors = [];

    if (!password || password.length === 0) {
        errors.push('Passord er påkrevd');
        return errors;
    }

    if (password.length < 8) {
        errors.push('Passordet må være minst 8 tegn');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Passordet må inneholde minst én stor bokstav');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Passordet må inneholde minst én liten bokstav');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Passordet må inneholde minst ett tall');
    }

    return errors;
}

// ============================================
// REGISTRATION
// ============================================
export async function handleRegister(e) {
    e.preventDefault();

    const email = document.getElementById('registerEmail')?.value;
    const password = document.getElementById('registerPassword')?.value;
    const confirmPassword = document.getElementById('registerConfirmPassword')?.value;
    const name = document.getElementById('registerName')?.value;
    const homeTeam = document.getElementById('registerHomeTeam')?.value;

    // Basic validation
    if (!email || !password || !name) {
        alert('Vennligst fyll ut alle feltene');
        return false;
    }

    // Email validation
    const emailError = validateEmail(email);
    if (emailError) {
        alert(emailError);
        return false;
    }

    // Password validation
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
        alert('Passordet oppfyller ikke kravene:\n\n' + passwordErrors.map(e => '• ' + e).join('\n'));
        return false;
    }

    // Confirm password match
    if (password !== confirmPassword) {
        alert('Passordene matcher ikke');
        return false;
    }

    try {
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Oppretter bruker...';
        submitBtn.disabled = true;

        // Create user in Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Create user profile in Firestore
        await db.collection('users').doc(user.uid).set({
            name: name,
            email: email,
            homeTeam: homeTeam || 'Mitt lag',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update display name
        await user.updateProfile({
            displayName: name
        });

        // Set APP state
        APP.currentUser = {
            uid: user.uid,
            email: user.email,
            displayName: name,
            homeTeam: homeTeam || 'Mitt lag'
        };
        APP.page = 'home';

        alert('Bruker opprettet! Velkommen til Handball Analytics 🎉');
        return true;

    } catch (error) {
        console.error('Registration error:', error);

        // User-friendly error messages
        let errorMessage = 'Kunne ikke opprette bruker. ';
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage += 'Denne e-postadressen er allerede registrert.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'Ugyldig e-postadresse.';
                break;
            case 'auth/weak-password':
                errorMessage += 'Passordet er for svakt.';
                break;
            default:
                errorMessage += error.message;
        }
        alert(errorMessage);

        // Reset button
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Opprett bruker';
            submitBtn.disabled = false;
        }

        return false;
    }
}

// ============================================
// LOGIN
// ============================================
export async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('username')?.value;
    const password = document.getElementById('password')?.value;

    if (!email || !password) {
        alert('Vennligst fyll ut både e-post og passord');
        return false;
    }

    try {
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Logger inn...';
        submitBtn.disabled = true;

        // Sign in with Firebase
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Get user profile from Firestore
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();

        // Set APP state
        APP.currentUser = {
            uid: user.uid,
            email: user.email,
            displayName: userData?.name || user.displayName || 'Bruker',
            homeTeam: userData?.homeTeam || 'Mitt lag'
        };
        APP.page = 'home';

        saveToLocalStorageImmediate();
        return true;

    } catch (error) {
        console.error('Login error:', error);

        // User-friendly error messages
        let errorMessage = 'Kunne ikke logge inn. ';
        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                errorMessage += 'Feil e-post eller passord.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'Ugyldig e-postadresse.';
                break;
            case 'auth/too-many-requests':
                errorMessage += 'For mange forsøk. Prøv igjen senere.';
                break;
            default:
                errorMessage += error.message;
        }
        alert(errorMessage);

        // Reset button
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }

        return false;
    }
}

// ============================================
// LOGOUT
// ============================================
export async function handleLogout() {
    if (confirm('Er du sikker på at du vil logge ut?')) {
        try {
            await auth.signOut();
            APP.currentUser = null;
            APP.page = 'login';
            // Clear current match data but keep completed matches
            APP.players = [];
            APP.opponents = [];
            APP.events = [];
            saveToLocalStorageImmediate();
            return true;
        } catch (error) {
            console.error('Logout error:', error);
            alert('Kunne ikke logge ut: ' + error.message);
            return false;
        }
    }
    return false;
}

// ============================================
// PASSWORD RESET
// ============================================
export async function handlePasswordReset(e) {
    e.preventDefault();

    const email = document.getElementById('resetEmail')?.value;

    if (!email) {
        alert('Vennligst skriv inn e-postadressen din');
        return false;
    }

    try {
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sender e-post...';
        submitBtn.disabled = true;

        await auth.sendPasswordResetEmail(email);

        alert('E-post for tilbakestilling av passord er sendt! Sjekk innboksen din.');

        // Go back to login
        APP.page = 'login';
        return true;

    } catch (error) {
        console.error('Password reset error:', error);

        let errorMessage = 'Kunne ikke sende e-post. ';
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage += 'Ingen bruker med denne e-postadressen.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'Ugyldig e-postadresse.';
                break;
            default:
                errorMessage += error.message;
        }
        alert(errorMessage);

        // Reset button
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }

        return false;
    }
}

// ============================================
// START NEW MATCH
// ============================================
export function startNewMatch() {
    console.log('🔄 Starting new match - resetting all match data...');

    // ============================================
    // RESET CORE MATCH DATA
    // ============================================
    APP.players = [];
    APP.opponents = [];
    APP.homeTeam = APP.currentUser?.homeTeam || 'Eget lag';
    APP.awayTeam = 'Motstander';
    APP.matchDate = new Date().toISOString().split('T')[0];
    APP.events = [];
    APP.currentHalf = 1;
    APP.activeKeeper = null;
    APP.mode = 'attack';

    // ============================================
    // RESET SHOT/MODAL STATE
    // ============================================
    APP.tempShot = null;
    APP.selectedResult = null;
    APP.showShotDetails = false;
    APP.shotDetailsData = null;

    // Reset advanced shot registration fields
    APP.shotRegistrationMode = 'simple';
    APP.selectedShooter = null;
    APP.selectedAttackType = null;
    APP.selectedShotPosition = null;
    APP.selectedAssist = null;

    // ============================================
    // RESET PLAYER MANAGEMENT STATE
    // ============================================
    APP.managingTeam = null;
    APP.tempPlayersList = [];
    APP.editingPlayerId = null;

    // ============================================
    // RESET TEAM ROSTER STATE
    // ============================================
    APP.editingTeamId = null;
    APP.importingTeamId = null;
    APP.viewingMatch = null;

    // ============================================
    // RESET TIMER STATE (CRITICAL!)
    // ============================================
    // Stop timer if it's running
    if (APP.timerState.intervalId) {
        clearInterval(APP.timerState.intervalId);
    }
    APP.timerState.isRunning = false;
    APP.timerState.currentTime = 0;
    APP.timerState.intervalId = null;

    // Reset timer config to default
    APP.timerConfig.halfLength = 30;

    // ============================================
    // RESET MATCH MODE TO SIMPLE
    // ============================================
    APP.matchMode = 'simple';

    // ============================================
    // RESET LOCKS
    // ============================================
    APP.isImportingFile = false;

    // ============================================
    // INVALIDATE CACHE
    // ============================================
    PERFORMANCE.invalidateStatsCache();

    // ============================================
    // NAVIGATE TO SETUP PAGE
    // ============================================
    APP.page = 'setup';
    saveToLocalStorageImmediate();

    console.log('✅ Match data reset complete - ready for new match');
}

// ============================================
// AUTH STATE OBSERVER
// ============================================
export function initAuthStateObserver(onAuthStateChanged) {
    console.log('🔐 Initializing Firebase Auth State Observer...');

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // User is signed in
            console.log('✅ User signed in:', user.email);
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                const userData = userDoc.data();

                APP.currentUser = {
                    uid: user.uid,
                    email: user.email,
                    displayName: userData?.name || user.displayName || 'Bruker',
                    homeTeam: userData?.homeTeam || 'Mitt lag'
                };

                console.log('✅ User profile loaded:', APP.currentUser.displayName);

                // Migrate localStorage data to Firestore (first time only)
                await migrateLocalStorageToFirestore();

                // Sync data from Firestore
                await syncFromFirestore();

                // Only change page if we're on login page
                if (APP.page === 'login' || APP.page === 'register' || APP.page === 'reset-password') {
                    APP.page = 'home';
                    console.log('📄 Redirecting to home page');
                }

                onAuthStateChanged();
            } catch (error) {
                console.error('❌ Error fetching user data:', error);
            }
        } else {
            // User is signed out
            console.log('🚪 User signed out or not authenticated');
            APP.currentUser = null;
            APP.page = 'login';
            onAuthStateChanged();
        }
    });
}
