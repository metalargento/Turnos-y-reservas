import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { Button, Input, Card, CardContent, Alert } from '../components/ui';
import { authApi } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import type { LoginRequest } from '../types';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LoginRequest>();

  const emailValue = watch('email');

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const wasEmailRemembered = localStorage.getItem('rememberEmail') === 'true';
    if (savedEmail && wasEmailRemembered) {
      setValue('email', savedEmail);
      setRememberEmail(true);
    }
  }, [setValue]);

  useEffect(() => {
    if (rememberEmail && emailValue) {
      localStorage.setItem('rememberedEmail', emailValue);
      localStorage.setItem('rememberEmail', 'true');
    } else if (!rememberEmail) {
      localStorage.removeItem('rememberedEmail');
      localStorage.removeItem('rememberEmail');
    }
  }, [rememberEmail, emailValue]);

  const onSubmit = async (data: LoginRequest) => {
    setError('');
    setIsLoading(true);
    try {
      const response = await authApi.login(data);
      login(response.access_token, response.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Credenciales inválidas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Iniciar sesión</h1>
            <p className="text-gray-500 mt-2">Ingresá a tu cuenta para continuar</p>
          </div>

          {error && <Alert variant="error">{error}</Alert>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input
                label="Email"
                type="email"
                placeholder="tu@email.com"
                {...register('email', {
                  required: 'El email es requerido',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email inválido',
                  },
                })}
                error={errors.email?.message}
              />
              <label className="flex items-center gap-2 mt-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberEmail}
                  onChange={(e) => setRememberEmail(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                />
                <span>Recordar este email</span>
              </label>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-display font-medium text-neutral-700">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`input ${errors.password?.message ? 'input-error' : ''} pr-10`}
                  {...register('password', {
                    required: 'La contraseña es requerida',
                    minLength: {
                      value: 6,
                      message: 'Mínimo 6 caracteres',
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password?.message && (
                <p className="text-sm text-error font-display font-medium">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Iniciar sesión
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500">
            ¿No tenés cuenta?{' '}
            <Link to="/register" className="text-black font-medium hover:underline">
              Crear cuenta
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
