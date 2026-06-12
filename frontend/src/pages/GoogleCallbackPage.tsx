import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

export function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state'); // business_id

        if (!code || !state) {
          setError('Callback inválido: faltan parámetros');
          setLoading(false);
          return;
        }

        // Enviar código al backend
        await apiClient.post('/api/google-oauth/callback', null, {
          params: {
            code,
            state,
          },
        });

        // Redirigir a Settings con éxito
        setTimeout(() => {
          navigate('/settings?success=gmail-connected');
        }, 1500);
      } catch (err: any) {
        const message = err.response?.data?.detail || 'Error al conectar Gmail';
        setError(message);
        setLoading(false);

        // Redirigir a Settings con error en 3 segundos
        setTimeout(() => {
          navigate('/settings');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-neutral-900">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {loading && !error ? (
          <>
            <div className="animate-spin w-12 h-12 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Conectando Gmail...
            </h2>
            <p className="text-sm text-gray-600 dark:text-neutral-400">
              Estamos autorizando tu cuenta. Esto tomará unos segundos.
            </p>
          </>
        ) : (
          <>
            {error ? (
              <>
                <div className="text-4xl mb-4">❌</div>
                <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                  Error al conectar
                </h2>
                <p className="text-sm text-gray-600 dark:text-neutral-400 mb-4">
                  {error}
                </p>
                <p className="text-xs text-gray-500 dark:text-neutral-500">
                  Redirigiendo a Settings...
                </p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-4">✅</div>
                <h2 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">
                  ¡Gmail conectado!
                </h2>
                <p className="text-sm text-gray-600 dark:text-neutral-400 mb-4">
                  Tu Gmail está configurado para enviar confirmaciones.
                </p>
                <p className="text-xs text-gray-500 dark:text-neutral-500">
                  Redirigiendo a Settings...
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
