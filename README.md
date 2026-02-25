# Portfolio

Portfolio personal desarrollado con React, Vite, Tailwind CSS y Firebase.

## Características

- 🌐 Interfaz multilingüe (Español/Inglés)
- 🎨 Modo claro/oscuro
- 📱 Diseño responsive
- 🔐 Panel de administración con Firebase Authentication
- 📝 Gestión de contenido (Proyectos, Testimonios, Blog)
- 🌍 Traducción automática con Google Translate API

## Tecnologías

- React 18
- Vite
- Tailwind CSS
- Firebase (Authentication, Firestore)
- React Router
- i18next
- Framer Motion

## Configuración

1. Clonar el repositorio
2. Instalar dependencias: `npm install`
3. Configurar variables de entorno en `.env`:
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_GOOGLE_TRANSLATE_API_KEY=...
   ```
4. Ejecutar en desarrollo: `npm run dev`
5. Build para producción: `npm run build`

## GitHub Pages

El proyecto está configurado para desplegarse automáticamente en GitHub Pages mediante GitHub Actions.

### Configuración de Secrets

Para que el build funcione correctamente, necesitas configurar los siguientes secrets en GitHub:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_GOOGLE_TRANSLATE_API_KEY`

### Habilitar GitHub Pages

1. Ve a Settings > Pages en tu repositorio
2. Selecciona "GitHub Actions" como fuente
3. El workflow se ejecutará automáticamente en cada push a `main`

## Estructura del Proyecto

```
src/
├── admin/          # Panel de administración
├── components/     # Componentes reutilizables
├── context/        # Contextos de React
├── firebase/       # Configuración y servicios de Firebase
├── pages/          # Páginas principales
├── services/       # Servicios externos
└── translations/   # Archivos de traducción
```
