import React, { useState } from 'react';
import { Button, Alert } from './ui';
import { apiClient } from '../api/client';

interface GmailConnectProps {
  businessId: string;
  googleEmail?: string;
  onConnectSuccess: () => void;
}

export function GmailConnect({ businessId, googleEmail, onConnectSuccess }: GmailConnectProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnectGmail = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.get(`/api/google-oauth/authorize/${businessId}`);
      const { auth_url } = response.data;

      // Redirigir a Google OAuth
      window.location.href = auth_url;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al conectar con Google');
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('¿Desconectar Gmail? Los emails se enviarán por Resend.')) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await apiClient.delete(`/api/google-oauth/${businessId}`);
      onConnectSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al desconectar');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-700 dark:text-neutral-200">Conectar Gmail</h4>

      {error && <Alert type="error" message={error} />}

      {googleEmail ? (
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Gmail conectado</p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">{googleEmail}</p>
            </div>
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Los emails de confirmación se enviarán desde tu Gmail.
          </p>
          <Button
            onClick={handleDisconnect}
            isLoading={isLoading}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            Desconectar Gmail
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-600 dark:text-neutral-400">
            Conecta tu Gmail para enviar confirmaciones de reservas desde tu email.
          </p>
          <Button
            onClick={handleConnectGmail}
            isLoading={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            🔗 Conectar con Google
          </Button>
        </div>
      )}
    </div>
  );
}
