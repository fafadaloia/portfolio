# Configuración de Secrets en GitHub

Para que el workflow de GitHub Actions funcione correctamente, necesitas configurar los siguientes secrets en tu repositorio.

## Método 1: Desde la interfaz web (Recomendado)

1. Ve a tu repositorio: https://github.com/fafadaloia/portfolio
2. Click en **Settings** → **Secrets and variables** → **Actions**
3. Click en **New repository secret**
4. Para cada secret, ingresa:
   - **Name**: El nombre del secret (ver lista abajo)
   - **Value**: El valor correspondiente de tu archivo `.env`
5. Click en **Add secret**

## Secrets requeridos

Configura estos secrets con los valores de tu archivo `.env`:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_GOOGLE_TRANSLATE_API_KEY`

## Método 2: Usando GitHub CLI

Si tienes GitHub CLI instalado:

```bash
# Autenticarse
gh auth login

# Configurar cada secret (reemplaza <valor> con el valor real)
gh secret set VITE_FIREBASE_API_KEY --body "<valor>"
gh secret set VITE_FIREBASE_AUTH_DOMAIN --body "<valor>"
gh secret set VITE_FIREBASE_PROJECT_ID --body "<valor>"
gh secret set VITE_FIREBASE_STORAGE_BUCKET --body "<valor>"
gh secret set VITE_FIREBASE_MESSAGING_SENDER_ID --body "<valor>"
gh secret set VITE_FIREBASE_APP_ID --body "<valor>"
gh secret set VITE_GOOGLE_TRANSLATE_API_KEY --body "<valor>"
```

## Método 3: Usando la API de GitHub

Puedes usar el script incluido:

```bash
node scripts/setup-secrets.js <GITHUB_TOKEN>
```

O configurar la variable de entorno:

```bash
GITHUB_TOKEN=<tu_token> node scripts/setup-secrets.js
```

**Nota**: Para crear un token de GitHub:
1. Ve a https://github.com/settings/tokens
2. Click en "Generate new token (classic)"
3. Selecciona los scopes: `repo`, `admin:repo_hook`
4. Copia el token generado

## Verificar configuración

Una vez configurados los secrets:
1. Ve a la pestaña **Actions** en tu repositorio
2. El workflow debería ejecutarse automáticamente en cada push a `main`
3. Si hay errores, revisa los logs del workflow
