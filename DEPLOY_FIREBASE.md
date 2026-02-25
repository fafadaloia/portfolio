# 🚀 Deploy a Firebase Hosting

El proyecto está configurado para desplegarse automáticamente en Firebase Hosting: **portfolio-eb263.web.app**

## Configuración Inicial (Solo una vez)

### 1. Instalar Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Iniciar sesión en Firebase

```bash
firebase login
```

### 3. Inicializar Firebase Hosting (ya está configurado)

El proyecto ya tiene `firebase.json` y `.firebaserc` configurados. Si necesitas reinicializar:

```bash
firebase init hosting
```

## Deploy Manual

Para hacer deploy manualmente:

```bash
npm run build
npm run deploy
```

O directamente:

```bash
firebase deploy --only hosting
```

## Deploy Automático con GitHub Actions

El proyecto está configurado para desplegarse automáticamente en cada push a `main`.

### Configurar el Secret de Firebase

1. Ve a Firebase Console: https://console.firebase.google.com/project/portfolio-eb263/settings/serviceaccounts/adminsdk
2. Click en "Generate new private key"
3. Descarga el archivo JSON
4. Ve a GitHub: https://github.com/fafadaloia/portfolio/settings/secrets/actions
5. Click en "New repository secret"
6. Name: `FIREBASE_SERVICE_ACCOUNT`
7. Value: Copia todo el contenido del archivo JSON descargado
8. Click en "Add secret"

### Verificar el Deploy

1. Ve a la pestaña **Actions** en GitHub
2. El workflow "Deploy to Firebase Hosting" se ejecutará automáticamente
3. Una vez completado, tu sitio estará disponible en: **https://portfolio-eb263.web.app**

## Secrets Requeridos

Asegúrate de tener configurados estos secrets en GitHub:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_GOOGLE_TRANSLATE_API_KEY`
- `FIREBASE_SERVICE_ACCOUNT` (nuevo - para el deploy)

## Verificar el Deploy

Una vez desplegado, puedes verificar:

1. **URL del sitio**: https://portfolio-eb263.web.app
2. **Firebase Console**: https://console.firebase.google.com/project/portfolio-eb263/hosting
3. **Logs del workflow**: Ve a Actions en GitHub

## Troubleshooting

### Error: "Firebase service account not found"
- Verifica que el secret `FIREBASE_SERVICE_ACCOUNT` esté configurado correctamente
- Asegúrate de copiar todo el contenido del JSON, incluyendo las llaves `{` y `}`

### Error: "Build failed"
- Revisa los logs del workflow
- Verifica que todos los secrets de VITE_* estén configurados

### El sitio no se actualiza
- Verifica que el workflow se ejecutó correctamente
- Limpia la caché del navegador (Ctrl + F5)
- Espera unos minutos, Firebase puede tardar en propagar los cambios
