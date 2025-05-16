// Verificar si estamos en un entorno de desarrollo o producción
const isDevelopment = process.env.NODE_ENV === "development"

// Configuración predeterminada para desarrollo (solo para vista previa)
const defaultConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000000000",
}

// Usar las variables de entorno si están disponibles, de lo contrario usar la configuración predeterminada
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || defaultConfig.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || defaultConfig.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || defaultConfig.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || defaultConfig.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || defaultConfig.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || defaultConfig.appId,
}

// Importar Firebase solo si estamos en el navegador
let app, auth, db, storage

// Verificar si estamos en el navegador (no en SSR)
if (typeof window !== "undefined") {
  try {
    // Importaciones dinámicas para evitar errores en SSR
    const firebase = require("firebase/app")
    const { getAuth } = require("firebase/auth")
    const { getFirestore } = require("firebase/firestore")
    const { getStorage } = require("firebase/storage")

    // Inicializar Firebase solo si no hay una instancia existente
    const apps = firebase.getApps()

    if (apps.length === 0) {
      app = firebase.initializeApp(firebaseConfig)
    } else {
      app = apps[0]
    }

    auth = getAuth(app)
    db = getFirestore(app)
    storage = getStorage(app)

    // Mostrar mensaje en la consola si estamos usando la configuración de demostración
    if (isDevelopment && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      console.warn(
        "Firebase está usando una configuración de demostración. Para habilitar todas las funcionalidades, configure las variables de entorno de Firebase.",
      )
    }
  } catch (error) {
    console.error("Error al inicializar Firebase:", error)

    // Crear objetos simulados para evitar errores
    auth = { onAuthStateChanged: () => () => {}, currentUser: null }
    db = { collection: () => ({ doc: () => ({}) }) }
    storage = {}

    console.warn("Firebase no está disponible. Se está utilizando una versión simulada con funcionalidad limitada.")
  }
}

export { auth, db, storage }
