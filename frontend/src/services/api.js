import axios from 'axios';

/**
 * Patrón Singleton para el cliente Axios.
 * Garantiza una única instancia con la baseURL del backend,
 * evitando la saturación de conexiones en el entorno frontend.
 */
class ApiSingleton {
  constructor() {
    if (!ApiSingleton.instance) {
      ApiSingleton.instance = axios.create({
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });

      // Interceptor de respuesta para manejo global de errores
      ApiSingleton.instance.interceptors.response.use(
        (response) => response,
        (error) => {
          console.error('[API Error]', error.response?.data || error.message);
          return Promise.reject(error);
        }
      );
    }
  }

  getInstance() {
    return ApiSingleton.instance;
  }
}

const api = new ApiSingleton().getInstance();
export default api;
