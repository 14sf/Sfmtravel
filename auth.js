/**
 * ====================================
 * SFM - Authentication Module
 * Handles user authentication with Firebase
 * ====================================
 */

class AuthManager {
    constructor() {
        this.isLogin = true;
        this.currentUser = null;
        this.authProviders = {
            google: null,
            facebook: null,
            apple: null
        };
        this.init();
    }

    init() {
        this.setupAuthProviders();
        this.setupEventListeners();
        this.setupAuthStateListener();
        this.initializeUI();
    }

    setupAuthProviders() {
        if (typeof firebase !== 'undefined') {
            this.authProviders.google = new firebase.auth.GoogleAuthProvider();
            this.authProviders.google.addScope('profile');
            this.authProviders.google.addScope('email');
            
            // Additional providers can be added here
            // this.authProviders.facebook = new firebase.auth.FacebookAuthProvider();
        }
    }

    setupEventListeners() {
        const authForm = document.getElementById('authForm');
        const authSwitchLink = document.getElementById('authSwitchLink');
        const googleAuthBtn = document.getElementById('googleAuth');

        // Form submission
        if (authForm) {
            authForm.addEventListener('submit', (e) => this.handleAuth(e));
        }

        // Toggle between login/register
        if (authSwitchLink) {
            authSwitchLink.addEventListener('click', (e) => this.switchAuthMode(e));
        }

        // Google authentication
        if (googleAuthBtn) {
            googleAuthBtn.addEventListener('click', () => this.signInWithGoogle());
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                const authContainer = document.getElementById('authContainer');
                if (authContainer && authContainer.style.display !== 'none') {
                    authForm?.dispatchEvent(new Event('submit'));
                }
            }
        });
    }

    setupAuthStateListener() {
        if (window.auth) {
            window.auth.onAuthStateChanged((user) => {
                this.handleAuthStateChange(user);
            });
        } else {
            // Mock authentication for development
            setTimeout(() => {
                const mockUser = {
                    uid: 'demo-user-123',
                    email: 'demo@example.com',
                    displayName: 'Demo User',
                    photoURL: null
                };
                this.handleAuthStateChange(mockUser);
            }, 1000);
        }
    }

    initializeUI() {
        // Add loading state
        this.setLoadingState(true);
        
        // Setup form validation
        this.setupFormValidation();
        
        // Setup social auth buttons
        this.setupSocialAuth();
    }

    setupFormValidation() {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        if (emailInput) {
            emailInput.addEventListener('blur', this.validateEmail.bind(this));
            emailInput.addEventListener('input', this.clearFieldError.bind(this));
        }

        if (passwordInput) {
            passwordInput.addEventListener('input', this.validatePassword.bind(this));
        }
    }

    setupSocialAuth() {
        // Add more social auth buttons if needed
        this.createAppleAuthButton();
        this.createFacebookAuthButton();
    }

    createAppleAuthButton() {
        // Apple Sign In button (placeholder)
        const googleBtn = document.getElementById('googleAuth');
        if (googleBtn && !document.getElementById('appleAuth')) {
            const appleBtn = googleBtn.cloneNode(true);
            appleBtn.id = 'appleAuth';
            appleBtn.innerHTML = '<i class="fab fa-apple"></i> Continuer avec Apple';
            appleBtn.style.backgroundColor = '#000';
            appleBtn.style.color = '#fff';
            appleBtn.style.marginTop = '0.5rem';
            appleBtn.addEventListener('click', () => this.signInWithApple());
            googleBtn.parentNode.insertBefore(appleBtn, googleBtn.nextSibling);
        }
    }

    createFacebookAuthButton() {
        // Facebook Sign In button (placeholder)
        const googleBtn = document.getElementById('googleAuth');
        if (googleBtn && !document.getElementById('facebookAuth')) {
            const facebookBtn = googleBtn.cloneNode(true);
            facebookBtn.id = 'facebookAuth';
            facebookBtn.innerHTML = '<i class="fab fa-facebook-f"></i> Continuer avec Facebook';
            facebookBtn.style.backgroundColor = '#1877f2';
            facebookBtn.style.color = '#fff';
            facebookBtn.style.marginTop = '0.5rem';
            facebookBtn.addEventListener('click', () => this.signInWithFacebook());
            
            const appleBtn = document.getElementById('appleAuth');
            if (appleBtn) {
                appleBtn.parentNode.insertBefore(facebookBtn, appleBtn.nextSibling);
            } else {
                googleBtn.parentNode.insertBefore(facebookBtn, googleBtn.nextSibling);
            }
        }
    }

    async handleAuth(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Validation
        if (!this.validateForm(email, password)) {
            return;
        }

        this.setLoadingState(true);

        try {
            if (window.auth) {
                if (this.isLogin) {
                    await this.signInWithEmail(email, password);
                } else {
                    await this.signUpWithEmail(email, password);
                }
            } else {
                // Mock authentication
                await this.mockAuthentication(email);
            }
        } catch (error) {
            this.handleAuthError(error);
        } finally {
            this.setLoadingState(false);
        }
    }

    async signInWithEmail(email, password) {
        const credential = await window.auth.signInWithEmailAndPassword(email, password);
        this.trackEvent('sign_in', { method: 'email' });
        return credential;
    }

    async signUpWithEmail(email, password) {
        const credential = await window.auth.createUserWithEmailAndPassword(email, password);
        
        // Update user profile
        if (credential.user) {
            await credential.user.updateProfile({
                displayName: email.split('@')[0]
            });
        }
        
        this.trackEvent('sign_up', { method: 'email' });
        return credential;
    }

    async signInWithGoogle() {
        if (!this.authProviders.google || !window.auth) {
            this.showError('Google authentication not available');
            return;
        }

        this.setLoadingState(true);

        try {
            const result = await window.auth.signInWithPopup(this.authProviders.google);
            this.trackEvent('sign_in', { method: 'google' });
            
            // Get additional user info
            const credential = firebase.auth.GoogleAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;
            
            console.log('Google sign-in successful', { token });
            
        } catch (error) {
            this.handleAuthError(error);
        } finally {
            this.setLoadingState(false);
        }
    }

    async signInWithApple() {
        // Apple Sign In implementation
        this.showError('Apple Sign In coming soon!');
    }

    async signInWithFacebook() {
        // Facebook Sign In implementation
        this.showError('Facebook Sign In coming soon!');
    }

    async mockAuthentication(email) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const mockUser = {
            uid: `mock-${Date.now()}`,
            email: email,
            displayName: email.split('@')[0],
            photoURL: null,
            emailVerified: true,
            isAnonymous: false,
            creationTime: new Date().toISOString(),
            lastSignInTime: new Date().toISOString()
        };

        this.handleAuthStateChange(mockUser);
    }

    handleAuthStateChange(user) {
        this.currentUser = user;
        
        if (user) {
            console.log('User authenticated:', user);
            this.showApp(user);
            this.initializeUserData(user);
            this.trackEvent('user_authenticated', { uid: user.uid });
        } else {
            console.log('User signed out');
            this.showAuth();
            this.clearUserData();
        }
        
        this.setLoadingState(false);
    }

    async initializeUserData(user) {
        try {
            // Update user info in UI
            this.updateUserUI(user);
            
            // Load user data from Firebase
            if (window.appState) {
                window.appState.currentUser = user;
                await window.appState.loadFromFirebase();
            }
            
            // Set up user-specific event listeners
            this.setupUserEventListeners();
            
        } catch (error) {
            console.error('Error initializing user data:', error);
        }
    }

    updateUserUI(user) {
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');
        
        if (userName) {
            userName.textContent = user.displayName || user.email || 'Utilisateur';
        }
        
        if (userAvatar) {
            if (user.photoURL) {
                userAvatar.innerHTML = `<img src="${user.photoURL}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            } else {
                const initial = (user.displayName || user.email || 'U')[0].toUpperCase();
                userAvatar.textContent = initial;
            }
        }
    }

    setupUserEventListeners() {
        // Profile management
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar && !userAvatar.hasAttribute('data-profile-listener')) {
            userAvatar.setAttribute('data-profile-listener', 'true');
            userAvatar.style.cursor = 'pointer';
            userAvatar.addEventListener('click', () => this.showProfileModal());
        }
    }

    showProfileModal() {
        // Create profile modal
        const modal = document.createElement('div');
        modal.className = 'profile-modal';
        modal.innerHTML = `
            <div class="profile-modal-content">
                <div class="profile-header">
                    <h2>Profil Utilisateur</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="profile-body">
                    <div class="profile-avatar">
                        ${this.currentUser.photoURL ? 
                            `<img src="${this.currentUser.photoURL}" alt="Avatar">` : 
                            `<div class="avatar-placeholder">${(this.currentUser.displayName || this.currentUser.email)[0].toUpperCase()}</div>`
                        }
                    </div>
                    <div class="profile-info">
                        <p><strong>Email:</strong> ${this.currentUser.email}</p>
                        <p><strong>Nom:</strong> ${this.currentUser.displayName || 'Non défini'}</p>
                        <p><strong>Dernière connexion:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>
                    <div class="profile-actions">
                        <button class="btn btn-primary" onclick="authManager.updateProfile()">Modifier le profil</button>
                        <button class="btn btn-error" onclick="authManager.logout()">Se déconnecter</button>
                    </div>
                </div>
            </div>
        `;

        // Add modal styles
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        document.body.appendChild(modal);

        // Close modal events
        modal.querySelector('.close-modal').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    switchAuthMode(e) {
        e.preventDefault();
        this.isLogin = !this.isLogin;
        
        const authButtonText = document.getElementById('authButtonText');
        const authSwitchText = document.getElementById('authSwitchText');
        const authSwitchLink = document.getElementById('authSwitchLink');

        if (this.isLogin) {
            authButtonText.textContent = 'Se connecter';
            authSwitchText.textContent = 'Pas de compte ?';
            authSwitchLink.textContent = "S'inscrire";
        } else {
            authButtonText.textContent = "S'inscrire";
            authSwitchText.textContent = 'Déjà un compte ?';
            authSwitchLink.textContent = 'Se connecter';
        }

        // Clear form errors
        this.clearAllErrors();
    }

    validateForm(email, password) {
        let isValid = true;

        // Email validation
        if (!email) {
            this.showFieldError('email', 'L\'email est requis');
            isValid = false;
        } else if (!Utils.validateEmail(email)) {
            this.showFieldError('email', 'Format d\'email invalide');
            isValid = false;
        }

        // Password validation
        if (!password) {
            this.showFieldError('password', 'Le mot de passe est requis');
            isValid = false;
        } else if (!this.isLogin && password.length < 6) {
            this.showFieldError('password', 'Le mot de passe doit contenir au moins 6 caractères');
            isValid = false;
        }

        return isValid;
    }

    validateEmail(e) {
        const email = e.target.value.trim();
        if (email && !Utils.validateEmail(email)) {
            this.showFieldError('email', 'Format d\'email invalide');
        } else {
            this.clearFieldError('email');
        }
    }

    validatePassword(e) {
        const password = e.target.value;
        if (!this.isLogin && password.length > 0 && password.length < 6) {
            this.showFieldError('password', 'Au moins 6 caractères requis');
        } else {
            this.clearFieldError('password');
        }
    }

    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        // Remove existing error
        this.clearFieldError(fieldId);

        // Add error styling
        field.style.borderColor = 'var(--error)';

        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            color: var(--error);
            font-size: 0.875rem;
            margin-top: 0.25rem;
            display: block;
        `;

        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(fieldIdOrEvent) {
        const fieldId = typeof fieldIdOrEvent === 'string' ? fieldIdOrEvent : fieldIdOrEvent.target.id;
        const field = document.getElementById(fieldId);
        if (!field) return;

        field.style.borderColor = '';
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    clearAllErrors() {
        document.querySelectorAll('.field-error').forEach(error => error.remove());
        document.querySelectorAll('.form-input').forEach(input => {
            input.style.borderColor = '';
        });
    }

    handleAuthError(error) {
        console.error('Authentication error:', error);
        
        let message = 'Une erreur est survenue lors de l\'authentification';
        
        // Firebase-specific error handling
        if (error.code) {
            switch (error.code) {
                case 'auth/user-not-found':
                    message = 'Aucun compte trouvé avec cet email';
                    this.showFieldError('email', message);
                    return;
                case 'auth/wrong-password':
                    message = 'Mot de passe incorrect';
                    this.showFieldError('password', message);
                    return;
                case 'auth/email-already-in-use':
                    message = 'Un compte existe déjà avec cet email';
                    this.showFieldError('email', message);
                    return;
                case 'auth/weak-password':
                    message = 'Le mot de passe est trop faible';
                    this.showFieldError('password', message);
                    return;
                case 'auth/invalid-email':
                    message = 'Format d\'email invalide';
                    this.showFieldError('email', message);
                    return;
                case 'auth/operation-not-allowed':
                    message = 'Cette méthode d\'authentification n\'est pas activée';
                    break;
                case 'auth/too-many-requests':
                    message = 'Trop de tentatives. Veuillez réessayer plus tard';
                    break;
                case 'auth/network-request-failed':
                    message = 'Erreur de connexion. Vérifiez votre connexion internet';
                    break;
                case 'auth/popup-closed-by-user':
                    message = 'Connexion annulée';
                    break;
                case 'auth/popup-blocked':
                    message = 'Popup bloqué. Autorisez les popups pour ce site';
                    break;
                default:
                    message = error.message || message;
            }
        }

        this.showError(message);
    }

    showError(message) {
        if (window.appState) {
            window.appState.showNotification(message, 'error');
        } else {
            alert(message);
        }
    }

    setLoadingState(loading) {
        const authButton = document.querySelector('#authForm .btn-primary');
        const googleButton = document.getElementById('googleAuth');
        const formInputs = document.querySelectorAll('#authForm .form-input');

        if (loading) {
            // Disable form
            formInputs.forEach(input => input.disabled = true);
            
            if (authButton) {
                authButton.disabled = true;
                authButton.innerHTML = `
                    <div class="loading"></div>
                    <span>Connexion...</span>
                `;
            }
            
            if (googleButton) {
                googleButton.disabled = true;
            }
        } else {
            // Enable form
            formInputs.forEach(input => input.disabled = false);
            
            if (authButton) {
                authButton.disabled = false;
                const buttonText = this.isLogin ? 'Se connecter' : 'S\'inscrire';
                authButton.innerHTML = `
                    <i class="fas fa-sign-in-alt"></i>
                    <span>${buttonText}</span>
                `;
            }
            
            if (googleButton) {
                googleButton.disabled = false;
            }
        }
    }

    showApp(user) {
        const authContainer = document.getElementById('authContainer');
        const appContainer = document.getElementById('appContainer');
        
        if (authContainer && appContainer) {
            authContainer.style.display = 'none';
            appContainer.style.display = 'block';
            
            // Trigger app initialization
            if (window.appState) {
                window.appState.currentUser = user;
                window.appState.updateDashboardStats();
            }
        }
    }

    showAuth() {
        const authContainer = document.getElementById('authContainer');
        const appContainer = document.getElementById('appContainer');
        
        if (authContainer && appContainer) {
            authContainer.style.display = 'flex';
            appContainer.style.display = 'none';
        }
        
        // Clear form
        this.clearForm();
        this.clearAllErrors();
    }

    clearForm() {
        const form = document.getElementById('authForm');
        if (form) {
            form.reset();
        }
    }

    clearUserData() {
        // Clear sensitive data from localStorage
        const keysToKeep = ['sfm_settings', 'sfm_theme'];
        const allKeys = Object.keys(localStorage);
        
        allKeys.forEach(key => {
            if (key.startsWith('sfm_') && !keysToKeep.includes(key)) {
                localStorage.removeItem(key);
            }
        });
    }

    async updateProfile() {
        const modal = document.querySelector('.profile-modal');
        if (modal) modal.remove();

        // Create profile update modal
        const updateModal = document.createElement('div');
        updateModal.className = 'profile-update-modal';
        updateModal.innerHTML = `
            <div class="profile-modal-content">
                <div class="profile-header">
                    <h2>Modifier le Profil</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="updateProfileForm" class="profile-update-form">
                    <div class="form-group">
                        <label for="displayName">Nom d'affichage</label>
                        <input type="text" id="displayName" class="form-input" 
                               value="${this.currentUser.displayName || ''}" 
                               placeholder="Votre nom">
                    </div>
                    <div class="form-group">
                        <label for="currentPassword">Mot de passe actuel</label>
                        <input type="password" id="currentPassword" class="form-input" 
                               placeholder="Pour confirmer les modifications">
                    </div>
                    <div class="form-group">
                        <label for="newPassword">Nouveau mot de passe (optionnel)</label>
                        <input type="password" id="newPassword" class="form-input" 
                               placeholder="Laisser vide si inchangé">
                    </div>
                    <div class="profile-actions">
                        <button type="submit" class="btn btn-primary">Mettre à jour</button>
                        <button type="button" class="btn" onclick="this.closest('.profile-update-modal').remove()">Annuler</button>
                    </div>
                </form>
            </div>
        `;

        updateModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        document.body.appendChild(updateModal);

        // Handle form submission
        const form = updateModal.querySelector('#updateProfileForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleProfileUpdate(e, updateModal);
        });

        // Close modal events
        updateModal.querySelector('.close-modal').onclick = () => updateModal.remove();
        updateModal.onclick = (e) => {
            if (e.target === updateModal) updateModal.remove();
        };
    }

    async handleProfileUpdate(e, modal) {
        const displayName = document.getElementById('displayName').value.trim();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;

        if (!currentPassword) {
            this.showError('Le mot de passe actuel est requis pour confirmer les modifications');
            return;
        }

        try {
            // Verify current password
            if (window.auth) {
                const credential = firebase.auth.EmailAuthProvider.credential(
                    this.currentUser.email,
                    currentPassword
                );
                await this.currentUser.reauthenticateWithCredential(credential);
            }

            // Update display name
            if (displayName && displayName !== this.currentUser.displayName) {
                if (window.auth) {
                    await this.currentUser.updateProfile({ displayName });
                }
                this.updateUserUI({ ...this.currentUser, displayName });
            }

            // Update password
            if (newPassword) {
                if (newPassword.length < 6) {
                    this.showError('Le nouveau mot de passe doit contenir au moins 6 caractères');
                    return;
                }
                
                if (window.auth) {
                    await this.currentUser.updatePassword(newPassword);
                }
            }

            modal.remove();
            this.showSuccess('Profil mis à jour avec succès');

        } catch (error) {
            this.handleAuthError(error);
        }
    }

    showSuccess(message) {
        if (window.appState) {
            window.appState.showNotification(message, 'success');
        } else {
            alert(message);
        }
    }

    async logout() {
        if (!confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
            return;
        }

        try {
            if (window.auth) {
                await window.auth.signOut();
            } else {
                // Mock logout
                this.handleAuthStateChange(null);
            }
            
            this.trackEvent('sign_out');
            this.showSuccess('Déconnexion réussie');
            
        } catch (error) {
            console.error('Logout error:', error);
            this.showError('Erreur lors de la déconnexion');
        }
    }

    // Password reset functionality
    async resetPassword(email) {
        if (!email) {
            this.showError('Veuillez entrer votre email');
            return;
        }

        try {
            if (window.auth) {
                await window.auth.sendPasswordResetEmail(email);
                this.showSuccess('Email de réinitialisation envoyé. Vérifiez votre boîte de réception.');
            } else {
                // Mock password reset
                this.showSuccess('Email de réinitialisation envoyé (mode démo)');
            }
        } catch (error) {
            this.handleAuthError(error);
        }
    }

    createForgotPasswordLink() {
        const authCard = document.querySelector('.auth-card');
        if (!authCard || document.querySelector('.forgot-password-link')) return;

        const forgotLink = document.createElement('div');
        forgotLink.className = 'forgot-password-link';
        forgotLink.innerHTML = `
            <a href="#" onclick="authManager.showForgotPasswordModal(); return false;" 
               style="color: var(--primary); text-decoration: none; font-size: 0.875rem;">
                Mot de passe oublié ?
            </a>
        `;
        forgotLink.style.marginTop = '1rem';

        const authSwitch = authCard.querySelector('.auth-switch');
        if (authSwitch) {
            authSwitch.parentNode.insertBefore(forgotLink, authSwitch);
        }
    }

    showForgotPasswordModal() {
        const modal = document.createElement('div');
        modal.className = 'forgot-password-modal';
        modal.innerHTML = `
            <div class="profile-modal-content">
                <div class="profile-header">
                    <h2>Réinitialiser le mot de passe</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="resetPasswordForm">
                    <div class="form-group">
                        <label for="resetEmail">Adresse email</label>
                        <input type="email" id="resetEmail" class="form-input" 
                               placeholder="Entrez votre email" required>
                    </div>
                    <div class="profile-actions">
                        <button type="submit" class="btn btn-primary">Envoyer</button>
                        <button type="button" class="btn" onclick="this.closest('.forgot-password-modal').remove()">Annuler</button>
                    </div>
                </form>
            </div>
        `;

        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        document.body.appendChild(modal);

        // Handle form submission
        const form = modal.querySelector('#resetPasswordForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('resetEmail').value;
            await this.resetPassword(email);
            modal.remove();
        });

        // Close modal events
        modal.querySelector('.close-modal').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    // Analytics and tracking
    trackEvent(eventName, properties = {}) {
        // Google Analytics tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, properties);
        }
        
        // Custom analytics
        console.log('Event tracked:', eventName, properties);
    }

    // Email verification
    async sendEmailVerification() {
        if (!this.currentUser) return;

        try {
            if (window.auth && this.currentUser.sendEmailVerification) {
                await this.currentUser.sendEmailVerification();
                this.showSuccess('Email de vérification envoyé');
            }
        } catch (error) {
            this.handleAuthError(error);
        }
    }

    // Check if user email is verified
    checkEmailVerification() {
        if (this.currentUser && !this.currentUser.emailVerified) {
            const verificationBanner = document.createElement('div');
            verificationBanner.className = 'verification-banner';
            verificationBanner.innerHTML = `
                <div style="background: var(--warning); color: white; padding: 1rem; text-align: center; position: fixed; top: 0; left: 0; right: 0; z-index: 9999;">
                    <span>Votre email n'est pas vérifié. </span>
                    <button onclick="authManager.sendEmailVerification()" 
                            style="background: none; border: none; color: white; text-decoration: underline; cursor: pointer;">
                        Renvoyer l'email de vérification
                    </button>
                    <button onclick="this.parentElement.parentElement.remove()" 
                            style="background: none; border: none; color: white; margin-left: 1rem; cursor: pointer;">
                        ×
                    </button>
                </div>
            `;
            
            document.body.prepend(verificationBanner);
            
            // Adjust main content margin
            document.body.style.paddingTop = '60px';
        }
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
    
    // Create forgot password link after a delay to ensure DOM is ready
    setTimeout(() => {
        window.authManager.createForgotPasswordLink();
    }, 100);
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}