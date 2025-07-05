import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseOptions, initializeApp } from 'firebase/app';
import {
  // @ts-ignore 
  getReactNativePersistence, initializeAuth
} from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

// Configuração do Firebase
// const firebaseConfig: FirebaseOptions = {
//   apiKey: Constants.expoConfig?.extra?.firebaseApiKey || "your-api-key",
//   authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || "innoma-obras.firebaseapp.com",
//   projectId: Constants.expoConfig?.extra?.firebaseProjectId || "innoma-obras",
//   storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket || "innoma-obras.appspot.com",
//   messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId || "123456789",
//   appId: Constants.expoConfig?.extra?.firebaseAppId || "1:123456789:android:abcdef",
// };

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyALwjePUW2GdfHhj8lRjpGsfGqsFiEgT_4",
  authDomain: "innoma-obras.firebaseapp.com",
  projectId: "innoma-obras",
  storageBucket: "innoma-obras.firebasestorage.app",
  messagingSenderId: "297511650433",
  appId: "1:297511650433:web:10ea41575f24c7617e7980",
  measurementId: "G-K0SNQZYW3Z"
};

// Verificar se está em desenvolvimento
const isDevelopment = __DEV__;

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Configurar Auth com persistência
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Configurar Firestore
const firestore = getFirestore(app);

// Configurar Storage
const storage = getStorage(app);

// Configurar Functions
const functions = getFunctions(app);

// Conectar aos emuladores em desenvolvimento
if (isDevelopment) {
  try {
    // Emulador do Auth (não precisa de configuração adicional)

    // Emulador do Firestore
    if (!firestore._delegate._terminated) {
      connectFirestoreEmulator(firestore, 'localhost', 8080);
    }

    // Emulador das Functions
    connectFunctionsEmulator(functions, 'localhost', 5001);

    console.log('🔧 Firebase emulators conectados');
  } catch (error) {
    console.warn('⚠️ Erro ao conectar emuladores:', error);
  }
}

export { auth, firestore, functions, storage };
export default app;

// Utilitários para configuração
export const FirebaseConfig = {
  isDevelopment,
  projectId: firebaseConfig.projectId,

  // Collections do Firestore
  collections: {
    users: 'users',
    obras: 'obras',
    tarefas: 'tarefas',
    diarios: 'diarios',
    equipe: 'equipe',
    materiais: 'materiais',
    documentos: 'documentos',
    sync: 'sync_logs',
  },

  // Storage paths
  storage: {
    avatars: 'avatars',
    documents: 'documents',
    photos: 'photos',
    audio: 'audio',
  },
};