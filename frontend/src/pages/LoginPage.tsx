import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button, Input, Card, CardContent, Alert } from '../components/ui';
import { authApi } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import type { LoginRequest } from '../types';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>();

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

            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              {...register('password', {
                required: 'La contraseña es requerida',
                minLength: {
                  value: 6,
                  message: 'Mínimo 6 caracteres',
                },
              })}
              error={errors.password?.message}
            />

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
