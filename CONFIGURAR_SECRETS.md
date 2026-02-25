# 🔐 Configuración de Secrets en GitHub

Para que el workflow de GitHub Actions funcione correctamente, necesitas configurar los secrets en tu repositorio.

## ⚡ Método Rápido (Recomendado)

1. **Abre tu repositorio en GitHub:**
   ```
   https://github.com/fafadaloia/portfolio/settings/secrets/actions
   ```

2. **Para cada secret, haz click en "New repository secret"** y configura:

   | Secret Name | Valor (del archivo .env) |
   |------------|--------------------------|
   | `VITE_FIREBASE_API_KEY` | Tu API Key de Firebase |
   | `VITE_FIREBASE_AUTH_DOMAIN` | Tu Auth Domain de Firebase |
   | `VITE_FIREBASE_PROJECT_ID` | Tu Project ID de Firebase |
   | `VITE_FIREBASE_STORAGE_BUCKET` | Tu Storage Bucket de Firebase |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | Tu Messaging Sender ID |
   | `VITE_FIREBASE_APP_ID` | Tu App ID de Firebase |
   | `VITE_GOOGLE_TRANSLATE_API_KEY` | Tu API Key de Google Translate |

3. **Click en "Add secret"** para cada uno

## 📝 Pasos Detallados

1. Ve a tu repositorio en GitHub
2. Click en **Settings** (en la barra superior del repositorio)
3. En el menú lateral, click en **Secrets and variables** → **Actions**
4. Click en **New repository secret**
5. Ingresa el **Name** (ej: `VITE_FIREBASE_API_KEY`)
6. Ingresa el **Value** (copia el valor de tu archivo `.env`)
7. Click en **Add secret**
8. Repite para todos los secrets de la lista

## ✅ Verificar

Una vez configurados todos los secrets:

1. Ve a la pestaña **Actions** en tu repositorio
2. Deberías ver el workflow "Deploy to GitHub Pages" ejecutándose
3. Si hay errores, revisa los logs del workflow

## 🔗 Enlaces Útiles

- **Configurar secrets:** https://github.com/fafadaloia/portfolio/settings/secrets/actions
- **Ver workflows:** https://github.com/fafadaloia/portfolio/actions
- **Configurar Pages:** https://github.com/fafadaloia/portfolio/settings/pages
