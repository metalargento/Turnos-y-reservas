import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button, Input, Card, CardContent, Alert } from '../components/ui';
import { authApi } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import type { RegisterRequest } from '../types';

interface RegisterFormData extends RegisterRequest {
  confirmPassword: string;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setError('');
    setIsLoading(true);
    try {
      const { confirmPassword: _cp, ...registerData } = data;
      const response = await authApi.register(registerData);
      login(response.access_token, response.user);
      navigate('/onboarding');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Crear cuenta</h1>
            <p className="text-gray-500 mt-2">Registrate para comenzar</p>
          </div>

          {error && <Alert variant="error">{error}</Alert>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Nombre completo"
              type="text"
              placeholder="Juan Pérez"
              {...register('full_name', {
                required: 'El nombre es requerido',
                minLength: {
                  value: 2,
                  message: 'Mínimo 2 caracteres',
                },
              })}
              error={errors.full_name?.message}
            />

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
              placeholder="Mínimo 8 caracteres"
              {...register('password', {
                required: 'La contraseña es requerida',
                minLength: {
                  value: 8,
                  message: 'Mínimo 8 caracteres',
                },
              })}
              error={errors.password?.message}
            />

            <Input
              label="Confirmar contraseña"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword', {
                required: 'Confirmá tu contraseña',
                validate: (v) => v === password || 'Las contraseñas no coinciden',
              })}
              error={errors.confirmPassword?.message}
            />

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Crear cuenta
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="text-black font-medium hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
