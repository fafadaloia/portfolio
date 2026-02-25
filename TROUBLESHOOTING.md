# 🔧 Troubleshooting - Pantalla en Blanco

Si ves una pantalla en blanco en GitHub Pages, sigue estos pasos:

## 1. Verificar el Workflow de GitHub Actions

1. Ve a la pestaña **Actions** en tu repositorio
2. Revisa si el workflow "Deploy to GitHub Pages" se ejecutó correctamente
3. Si hay errores, revisa los logs del workflow

### Errores Comunes:

**Error: "Missing or insufficient permissions"**
- Verifica que los secrets estén configurados correctamente
- Ve a: Settings → Secrets and variables → Actions

**Error: "Build failed"**
- Revisa los logs del workflow para ver el error específico
- Puede ser que falte algún secret o haya un error en el código

## 2. Verificar los Secrets

Asegúrate de que todos estos secrets estén configurados:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_GOOGLE_TRANSLATE_API_KEY`

## 3. Verificar la Configuración de GitHub Pages

1. Ve a Settings → Pages
2. Verifica que la fuente sea "GitHub Actions"
3. Verifica que la rama sea "main"

## 4. Verificar la URL

La URL debería ser:
- `https://fafadaloia.github.io/portfolio/` (si el repositorio se llama "portfolio")

Si el repositorio se llama `fafadaloia.github.io` (página de usuario), entonces:
- La URL sería: `https://fafadaloia.github.io/`
- Y necesitarías cambiar el `base` en `vite.config.js` a `'/'`

## 5. Verificar la Consola del Navegador

1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña "Console"
3. Busca errores en rojo
4. Los errores más comunes:
   - `Failed to load resource` - Problema con las rutas de los assets
   - `Firebase: Error` - Problema con la configuración de Firebase
   - `Uncaught Error` - Error en el código JavaScript

## 6. Verificar que el Build se Completó

1. Ve a la pestaña **Actions**
2. Click en el último workflow ejecutado
3. Verifica que el paso "Build" se completó exitosamente
4. Verifica que el paso "Deploy to GitHub Pages" se completó exitosamente

## 7. Forzar un Nuevo Deploy

Si todo lo anterior está bien, intenta:
1. Ve a Actions
2. Click en "Deploy to GitHub Pages"
3. Click en "Run workflow"
4. Selecciona la rama "main"
5. Click en "Run workflow"

## 8. Verificar el Archivo index.html

Asegúrate de que el archivo `index.html` en el build tenga las rutas correctas. Si usas `/portfolio/` como base, las rutas deben empezar con `/portfolio/`.

## Solución Rápida

Si nada funciona, intenta:

1. Verifica que todos los secrets estén configurados
2. Ejecuta el workflow manualmente desde Actions
3. Espera a que termine el deploy (puede tardar unos minutos)
4. Limpia la caché del navegador (Ctrl + F5)
5. Verifica la consola del navegador para errores
