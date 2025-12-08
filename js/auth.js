// ============================================
// LOGIN & AUTH WITH FIREBASE
// ============================================
import { APP, PERFORMANCE } from './state.js';
import { saveToLocalStorageImmediate } from './storage.js';
import { auth, db } from './firebase-config.js';

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

    // Validation
    if (!email || !password || !name) {
        alert('Vennligst fyll ut alle feltene');
        return false;
    }

    if (password.length < 6) {
        alert('Passordet må være minst 6 tegn');
        return false;
    }

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
        APP.page = 'welcome';

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
        APP.page = 'welcome';

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
    // Nullstill spillerdata, men behold kamphistorikk
    APP.players = [];
    APP.opponents = [];
    APP.homeTeam = APP.currentUser?.homeTeam || 'Hjemmelag';
    APP.awayTeam = 'Bortelag';
    APP.matchDate = new Date().toISOString().split('T')[0];
    APP.events = [];
    APP.currentHalf = 1;
    APP.activeKeeper = null;
    APP.mode = 'attack';
    APP.tempShot = null;
    APP.selectedResult = null;

    // Invalider cache
    PERFORMANCE.invalidateStatsCache();

    APP.page = 'setup';
    saveToLocalStorageImmediate();
}

// ============================================
// AUTH STATE OBSERVER
// ============================================
export function initAuthStateObserver(onAuthStateChanged) {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // User is signed in
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                const userData = userDoc.data();

                APP.currentUser = {
                    uid: user.uid,
                    email: user.email,
                    displayName: userData?.name || user.displayName || 'Bruker',
                    homeTeam: userData?.homeTeam || 'Mitt lag'
                };

                // Only change page if we're on login page
                if (APP.page === 'login') {
                    APP.page = 'welcome';
                }

                onAuthStateChanged();
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        } else {
            // User is signed out
            APP.currentUser = null;
            APP.page = 'login';
            onAuthStateChanged();
        }
    });
}
