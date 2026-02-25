// Configuración de Firebase
// Reemplazá estos valores con tus credenciales de Firebase
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Verificar que las variables de entorno estén configuradas
const isFirebaseConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.authDomain && 
  firebaseConfig.projectId;

let app = null;
let auth = null;
let db = null;

try {
  if (isFirebaseConfigured) {
    // Inicializar Firebase
    app = initializeApp(firebaseConfig);
    // Inicializar servicios
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Log para verificar configuración (solo en desarrollo)
    if (import.meta.env.DEV) {
      console.log('qué mirás curioso?');
    }
  }
} catch (error) {
  // Log del error para debugging
  if (typeof window !== 'undefined') {
    console.error('Error inicializando Firebase:', error);
  }
}

export { auth, db };
export default app;
