import { useState } from 'react';
import { FiLock, FiMail, FiEye, FiEyeOff } from 'react-icons/fi';
import { login } from '../../firebase/auth';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      onLoginSuccess();
    } else {
      // Traducir mensajes de error de Firebase a español
      let errorMessage = result.error || 'Error al iniciar sesión';
      if (errorMessage.includes('auth/invalid-credential')) {
        errorMessage = 'Email o contraseña incorrectos. Verificá tus credenciales.';
      } else if (errorMessage.includes('auth/user-not-found')) {
        errorMessage = 'Usuario no encontrado. Asegurate de que el usuario exista en Firebase Authentication.';
      } else if (errorMessage.includes('auth/wrong-password')) {
        errorMessage = 'Contraseña incorrecta.';
      } else if (errorMessage.includes('auth/invalid-email')) {
        errorMessage = 'Email inválido.';
      } else if (errorMessage.includes('auth/too-many-requests')) {
        errorMessage = 'Demasiados intentos fallidos. Intentá más tarde.';
      }
      setError(errorMessage);
    }
    
    setLoading(false);
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4">
      <div className="w-full space-y-8 rounded-2xl border border-primary/10 bg-white/60 p-8 shadow-sm transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/60">
        <div>
          <h2 className="text-3xl font-semibold text-primary dark:text-linkDark">Panel de Administración</h2>
          <p className="mt-2 text-sm text-linkLight/80 dark:text-linkDark/80">
            Ingresá tus credenciales para acceder
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-600 dark:border-red-500/50 dark:bg-red-900/20 dark:text-red-400">
              <p className="font-semibold">{error}</p>
              {error.includes('incorrectos') && (
                <p className="mt-2 text-xs">
                  Si es la primera vez que ingresás, necesitás crear el usuario en Firebase Console:
                  <br />
                  <span className="font-mono">Authentication → Users → Add user</span>
                </p>
              )}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
              Email
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-linkLight/60 dark:text-linkDark/60" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-primary/20 bg-white/80 pl-10 pr-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
                placeholder="tu@email.com"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
              Contraseña
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-linkLight/60 dark:text-linkDark/60" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-primary/20 bg-white/80 pl-10 pr-10 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-linkLight/60 hover:text-linkLight dark:text-linkDark/60 dark:hover:text-linkDark"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-gradient w-full text-xs uppercase disabled:opacity-50"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
