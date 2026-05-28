import { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

const BACKEND_URL = 'https://turnos-y-reservas.fly.dev';

export default async (req: VercelRequest, res: VercelResponse) => {
  const { path = '' } = req.query;
  const pathname = Array.isArray(path) ? path.join('/') : (path || '');

  // Construct target URL: /api/proxy?path=auth/login -> /api/auth/login
  const targetUrl = `${BACKEND_URL}/api/${pathname}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        'Content-Type': req.headers['content-type'] || 'application/json',
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.text();

    res.status(response.status);
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    res.send(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy error' });
  }
};
