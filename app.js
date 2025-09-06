/**
 * ====================================
 * SFM - Songa Finance Manager
 * Main Application Controller
 * ====================================
 */

// Firebase Configuration
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || "your-api-key",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "your-project-id",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: process.env.FIREBASE_APP_ID || "your-app-id"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    window.auth = firebase.auth();
    window.db = firebase.firestore();
} else {
    console.warn('Firebase not loaded, using mock data');
}

/**
 * Application State Management
 */
class AppState {
    constructor() {
        this.currentUser = null;
        this.currentModule = 'dashboard';
        this.data = {
            transactions: this.loadData('transactions', []),
            travelOffers: this.loadData('travelOffers', []),
            bookings: this.loadData('bookings', []),
            tontines: this.loadData('tontines', []),
            teamMembers: this.loadData('teamMembers', []),
            settings: this.loadData('settings', {})
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInitialData();
    }

    setupEventListeners() {
        // Global error handling
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            this.showNotification('Une erreur est survenue', 'error');
        });

        // Online/offline status
        window.addEventListener('online', () => {
            this.showNotification('Connexion rétablie', 'success');
        });

        window.addEventListener('offline', () => {
            this.showNotification('Mode hors ligne', 'warning');
        });
    }

    loadData(key, defaultValue = []) {
        try {
            const stored = localStorage.getItem(`sfm_${key}`);
            return stored ? JSON.parse(stored) : defaultValue;
        } catch (error) {
            console.error(`Error loading ${key}:`, error);
            return defaultValue;
        }
    }

    saveData(key, data) {
        try {
            this.data[key] = data;
            localStorage.setItem(`sfm_${key}`, JSON.stringify(data));
            
            // Sync to Firebase if available and user is logged in
            if (window.db && this.currentUser) {
                this.syncToFirebase(key, data);
            }
        } catch (error) {
            console.error(`Error saving ${key}:`, error);
        }
    }

    async syncToFirebase(key, data) {
        try {
            await window.db.collection('users')
                .doc(this.currentUser.uid)
                .collection('data')
                .doc(key)
                .set({ data, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
        } catch (error) {
            console.error(`Firebase sync error for ${key}:`, error);
        }
    }

    async loadFromFirebase() {
        if (!window.db || !this.currentUser) return;

        try {
            const userDataRef = window.db.collection('users').doc(this.currentUser.uid).collection('data');
            const snapshot = await userDataRef.get();
            
            snapshot.forEach(doc => {
                const docData = doc.data();
                if (docData.data) {
                    this.data[doc.id] = docData.data;
                    localStorage.setItem(`sfm_${doc.id}`, JSON.stringify(docData.data));
                }
            });
            
            console.log('Data loaded from Firebase');
        } catch (error) {
            console.error('Error loading from Firebase:', error);
        }
    }

    loadInitialData() {
        // Load demo data if first time user
        if (this.data.transactions.length === 0) {
            this.loadDemoData();
        }
    }

    loadDemoData() {
        const demoTransactions = [
            {
                id: Date.now() - 1000,
                description: "Safari Kenya - Réservation",
                amount: -850,
                category: "Voyage",
                date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                type: "expense"
            },
            {
                id: Date.now() - 2000,
                description: "Commission booking plongée",
                amount: 120,
                category: "Revenus",
                date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
                type: "income"
            },
            {
                id: Date.now() - 3000,
                description: "Tontine septembre",
                amount: -200,
                category: "Tontine",
                date: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
                type: "expense"
            }
        ];

        const demoTontines = [
            {
                id: 1,
                name: "Tontine Famille",
                contribution: 200,
                members: 8,
                maxMembers: 10