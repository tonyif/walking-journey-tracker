/**
 * Firebase Cloud Sync Module
 * Handles authentication and real-time data synchronization with Firestore
 * Corp QA Compliant with JSDoc Documentation
 */

// Firebase Configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBH4-FYKmibVcF9FvycvvWER_HGAejxnJA',
  authDomain: 'globe-trekker.firebaseapp.com',
  projectId: 'globe-trekker',
  storageBucket: 'globe-trekker.firebasestorage.app',
  messagingSenderId: '900957194864',
  appId: '1:900957194864:web:0b146ca2cdac141a40c2b5',
};

/** @type {firebase.auth.Auth|null} Firebase Auth instance */
let auth;

/** @type {firebase.firestore.Firestore|null} Firestore database instance */
let db;

/** @type {firebase.User|null} Currently authenticated user */
let user;

/** @type {boolean} Whether cloud sync is currently enabled */
let isSyncEnabled = false;

/**
 * Initializes Firebase SDK and sets up authentication
 * @returns {boolean} True if initialization successful, false otherwise
 */
function initFirebase() {
  if (typeof firebase === 'undefined') {
    logger.warn('Firebase not loaded - running in offline mode');
    return false;
  }

  try {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();

    // Listen for auth state changes
    auth.onAuthStateChanged(handleAuthChange);

    logger.info('Firebase initialized successfully');
    return true;
  } catch (error) {
    logger.error('Firebase initialization error', { error: error.message });
    return false;
  }
}

/**
 * Handles authentication state changes
 * @param {firebase.User|null} currentUser - The currently authenticated user
 */
function handleAuthChange(currentUser) {
  user = currentUser;
  updateSyncUI();

  if (user) {
    logger.info('User signed in', { email: user.email, uid: user.uid });
    setupRealtimeSync();
    syncFromCloud();
  } else {
    logger.info('User signed out');
    document.getElementById('syncStatus').textContent = 'Not syncing';
  }
}

/**
 * Sets up real-time listeners for walks and routes collections
 * Automatically syncs changes from Firestore to local storage
 */
function setupRealtimeSync() {
  if (!user || !db) return;

  db.collection('users')
    .doc(user.uid)
    .collection('walks')
    .onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          syncWalkFromCloud(change.doc);
        }
      });
    });

  db.collection('users')
    .doc(user.uid)
    .collection('routes')
    .doc('current')
    .onSnapshot((doc) => {
      if (doc.exists) {
        const cloudRoute = doc.data();
        if (cloudRoute && JSON.stringify(cloudRoute) !== JSON.stringify(routeConfig)) {
          routeConfig = cloudRoute;
          localStorage.setItem('routeConfig', JSON.stringify(routeConfig));
          updateRouteDisplay();
        }
      }
    });
}

/**
 * Syncs a single walk from cloud to local storage
 * @param {firebase.firestore.DocumentSnapshot} doc - Firestore document snapshot
 */
function syncWalkFromCloud(doc) {
  const cloudWalk = doc.data();
  const existingIndex = walks.findIndex((w) => w.id === doc.id);

  if (existingIndex >= 0) {
    walks[existingIndex] = { ...cloudWalk, id: doc.id };
    logger.debug('Walk updated from cloud', { walkId: doc.id, date: cloudWalk.date });
  } else {
    walks.push({ ...cloudWalk, id: doc.id });
    logger.debug('Walk added from cloud', { walkId: doc.id, date: cloudWalk.date });
  }

  localStorage.setItem('walks', JSON.stringify(walks));
  updateStats();
  updateHistory();
}

/**
 * Syncs all local data (walks and route) to Firestore
 * @async
 * @returns {Promise<void>}
 */
async function syncToCloud() {
  if (!user || !db || !isSyncEnabled) return;

  try {
    // Sync walks
    for (const walk of walks) {
      await db.collection('users').doc(user.uid).collection('walks').doc(walk.id)
        .set(walk);
    }

    // Sync route
    if (routeConfig) {
      await db
        .collection('users')
        .doc(user.uid)
        .collection('routes')
        .doc('current')
        .set(routeConfig);
    }

    document.getElementById('syncStatus').textContent = '✅ Synced';
    logger.info('Data synced to cloud successfully', { walkCount: walks.length });
    setTimeout(() => {
      document.getElementById('syncStatus').textContent = '🔄 Auto-syncing';
    }, 2000);
  } catch (error) {
    logger.error('Sync to cloud failed', { error: error.message });
    document.getElementById('syncStatus').textContent = '❌ Sync failed';
  }
}

/**
 * Downloads all data from Firestore to local storage
 * @async
 * @returns {Promise<void>}
 */
async function syncFromCloud() {
  if (!user || !db) return;

  try {
    document.getElementById('syncStatus').textContent = '⬇️ Downloading...';

    // Get walks
    const walksSnapshot = await db.collection('users').doc(user.uid).collection('walks').get();

    if (!walksSnapshot.empty) {
      walks = walksSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      localStorage.setItem('walks', JSON.stringify(walks));
    }

    // Get route
    const routeDoc = await db
      .collection('users')
      .doc(user.uid)
      .collection('routes')
      .doc('current')
      .get();

    if (routeDoc.exists) {
      routeConfig = routeDoc.data();
      localStorage.setItem('routeConfig', JSON.stringify(routeConfig));
      updateRouteDisplay();
    }

    updateStats();
    updateHistory();
    document.getElementById('syncStatus').textContent = '🔄 Auto-syncing';
    logger.info('Data synced from cloud successfully', { walkCount: walks.length });
  } catch (error) {
    logger.error('Download from cloud failed', { error: error.message });
    document.getElementById('syncStatus').textContent = '❌ Download failed';
  }
}

/**
 * Updates the route display UI with current route configuration
 */
function updateRouteDisplay() {
  if (routeConfig) {
    startPoint = routeConfig.startCoords;
    endPoint = routeConfig.endCoords;
    document.getElementById('routeSubtitle').textContent = `${routeConfig.startName} to ${routeConfig.endName}`;
    document.getElementById('setupSection').style.display = 'none';
    initMap();
  }
}

/**
 * Updates the sync UI elements based on authentication state
 */
function updateSyncUI() {
  const syncButton = document.getElementById('syncButton');
  const syncStatus = document.getElementById('syncStatus');
  const userEmail = document.getElementById('userEmail');

  if (user) {
    syncButton.textContent = '🚪 Sign Out';
    syncButton.style.background = '#dc3545';
    userEmail.textContent = user.email;
    syncStatus.textContent = '🔄 Auto-syncing';
    isSyncEnabled = true;
  } else {
    syncButton.textContent = '☁️ Sign In to Sync';
    syncButton.style.background = '#10b981';
    userEmail.textContent = 'Not signed in';
    syncStatus.textContent = 'Not syncing';
    isSyncEnabled = false;
  }
}

/**
 * Handles sign in/sign out button click
 * Signs in with Google or signs out the current user
 * @async
 * @returns {Promise<void>}
 */
async function handleSyncButton() {
  if (user) {
    // Sign out
    if (confirm('Sign out? Your data will stay on this device.')) {
      await auth.signOut();
      logger.info('User signed out successfully');
    }
  } else {
    // Sign in with Google
    try {
      document.getElementById('syncStatus').textContent = '⏳ Signing in...';

      const provider = new firebase.auth.GoogleAuthProvider();
      await auth.signInWithPopup(provider);

      logger.info('Google Sign-In successful');
      alert('✅ Signed in successfully with Google! Your data is now syncing.');
    } catch (error) {
      logger.error('Google Sign-In failed', { error: error.message, code: error.code });
      alert(`❌ Error: ${error.message}`);
      document.getElementById('syncStatus').textContent = 'Sign in failed';
    }
  }
}

// Export for use in main app
if (typeof window !== 'undefined') {
  window.firebaseSync = {
    init: initFirebase,
    syncToCloud,
    syncFromCloud,
    handleSyncButton,
  };
}
