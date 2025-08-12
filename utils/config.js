// utils/config.js
// Centraliza la URL base del backend para toda la app

// Detectar si estamos en producción HTTPS
const isProduction = typeof window !== 'undefined' && window.location.protocol === 'https:';
const isHTTPS = typeof window !== 'undefined' && window.location.href.includes('https://');

// Si estamos en HTTPS, usar el proxy interno; si no, usar la URL directa
export const API_BASE_URL = isHTTPS 
  ? '/api'  // Usar proxy interno para evitar Mixed Content
  : process.env.NEXT_PUBLIC_API_BASE_URL || 'http://18.190.126.143:3000';

// Para debugging
if (typeof window !== 'undefined') {
  console.log('🔧 API Configuration:', {
    protocol: window.location.protocol,
    isHTTPS,
    API_BASE_URL: isHTTPS ? '/api (usando proxy)' : API_BASE_URL,
    originalURL: process.env.NEXT_PUBLIC_API_BASE_URL
  });
}
