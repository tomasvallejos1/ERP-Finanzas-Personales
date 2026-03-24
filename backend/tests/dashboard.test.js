import { jest } from '@jest/globals';

// Mock de Supabase ANTES de importar app (requerido por ESM)
const mockRpc = jest.fn();
jest.unstable_mockModule('../src/config/supabase.js', () => ({
  default: { rpc: mockRpc }
}));

const request = (await import('supertest')).default;
const { default: app } = await import('../src/app.js');

describe('GET /api/dashboard', () => {
  afterEach(() => jest.clearAllMocks());

  it('debe retornar status 200 OK', async () => {
    mockRpc
      .mockResolvedValueOnce({ data: 125000.50, error: null })
      .mockResolvedValueOnce({ data: [
        { categoria: 'Alimentos', total: 35000 },
        { categoria: 'Transporte', total: 12000 }
      ], error: null })
      .mockResolvedValueOnce({ data: [
        { descripcion: 'Notebook', cuotas_restantes: 5, monto_cuota: 8500 }
      ], error: null });

    const res = await request(app).get('/api/dashboard');
    expect(res.status).toBe(200);
  });

  it('debe contener patrimonio_total, gastos_por_categoria y cuotas_pendientes', async () => {
    mockRpc
      .mockResolvedValueOnce({ data: 125000.50, error: null })
      .mockResolvedValueOnce({ data: [
        { categoria: 'Alimentos', total: 35000 }
      ], error: null })
      .mockResolvedValueOnce({ data: [
        { descripcion: 'Notebook', cuotas_restantes: 5, monto_cuota: 8500 }
      ], error: null });

    const res = await request(app).get('/api/dashboard');
    expect(res.body).toHaveProperty('patrimonio_total');
    expect(res.body).toHaveProperty('gastos_por_categoria');
    expect(res.body).toHaveProperty('cuotas_pendientes');
  });

  it('debe retornar 500 si Supabase falla', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });

    const res = await request(app).get('/api/dashboard');
    expect(res.status).toBe(500);
  });
});
