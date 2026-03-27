import { useState, useEffect } from 'react';
import { Wallet, TrendingDown, CreditCard, RefreshCw } from 'lucide-react';
import api from '../services/api.js';
import DashboardCard from '../components/DashboardCard.jsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const formatCurrency = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n ?? 0);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/dashboard');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  // ── Loading state ──────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <header className="flex items-center justify-between mb-10">
          <div>
            <div className="h-8 w-48 bg-card rounded-md animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-card rounded-md animate-pulse"></div>
          </div>
          <div className="h-10 w-10 bg-card rounded-xl animate-pulse"></div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-card rounded-xl border border-border animate-pulse"></div>
          ))}
        </section>

        <section className="mb-10">
          <div className="h-6 w-40 bg-card rounded-md animate-pulse mb-4"></div>
          <div className="h-72 bg-card rounded-xl border border-border animate-pulse mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-card rounded-xl border border-border animate-pulse"></div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );

  // ── Error state ────────────────────────────────────────────────
  if (error) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-danger text-lg font-semibold">No se pudo conectar al servidor</p>
        <p className="text-text-secondary text-sm">{error}</p>
        <button
          onClick={fetchDashboard}
          className="mt-2 px-4 py-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors text-sm font-medium"
        >
          Reintentar
        </button>
      </div>
    </div>
  );

  // ── Computed values ────────────────────────────────────────────
  const totalGastos = data.gastos_por_categoria?.reduce((s, g) => s + Number(g.total), 0) ?? 0;
  const totalCuotas = data.cuotas_pendientes?.reduce(
    (s, c) => s + Number(c.monto_cuota) * Number(c.cuotas_restantes), 0
  ) ?? 0;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sidebar placeholder (futuro) ── */}
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
            <p className="text-text-secondary mt-1 text-sm">Resumen de tus finanzas personales</p>
          </div>
          <button
            onClick={fetchDashboard}
            title="Actualizar"
            className="p-2.5 rounded-xl border border-border text-text-secondary hover:text-accent hover:border-accent/40 transition-colors"
          >
            <RefreshCw size={18} />
          </button>
        </header>

        {/* ── Tarjetas de resumen ── */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          <DashboardCard
            title="Patrimonio Total"
            value={formatCurrency(data.patrimonio_total)}
            icon={Wallet}
            trend="up"
          />
          <DashboardCard
            title="Gastos del Mes"
            value={formatCurrency(totalGastos)}
            icon={TrendingDown}
            trend="down"
          />
          <DashboardCard
            title="Deuda en Cuotas"
            value={formatCurrency(totalCuotas)}
            icon={CreditCard}
          />
        </section>

        {/* ── Gastos por categoría ── */}
        {data.gastos_por_categoria?.length > 0 ? (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Gastos por Categoría</h2>
            
            {/* Gráfico */}
            <div className="h-80 w-full bg-card border border-border rounded-xl p-6 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.gastos_por_categoria}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                  <XAxis 
                    dataKey="categoria" 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `$${value}`} 
                    dx={-10}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc' }}
                    itemStyle={{ color: '#10b981' }}
                    formatter={(value) => [formatCurrency(value), 'Total']}
                  />
                  <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Lista */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.gastos_por_categoria.map((g) => (
                <div key={g.categoria} className="flex items-center justify-between rounded-xl bg-card border border-border px-5 py-4">
                  <span className="text-text-secondary text-sm">{g.categoria}</span>
                  <span className="font-semibold text-text-primary">{formatCurrency(g.total)}</span>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="mb-10 text-center py-16 bg-card rounded-xl border border-dashed border-border flex flex-col items-center justify-center">
            <TrendingDown className="h-12 w-12 text-text-secondary mb-4 opacity-40 mx-auto" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No hay gastos registrados</h3>
            <p className="text-text-secondary mb-6 text-sm max-w-sm mx-auto">
              Aún no tienes gastos para mostrar. Ingresa tus primeros movimientos para comenzar a visualizar tus estadísticas.
            </p>
            <button className="px-6 py-2.5 bg-accent text-background font-medium rounded-lg hover:bg-emerald-400 transition-colors shadow-lg shadow-accent/20">
              Cargar tu primer gasto
            </button>
          </section>
        )}

        {/* ── Cuotas pendientes ── */}
        {data.cuotas_pendientes?.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-4">Cuotas Pendientes</h2>
            <div className="rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-card-hover">
                  <tr>
                    <th className="text-left px-5 py-3 text-text-secondary font-medium">Descripción</th>
                    <th className="text-right px-5 py-3 text-text-secondary font-medium">Cuotas rest.</th>
                    <th className="text-right px-5 py-3 text-text-secondary font-medium">Monto/cuota</th>
                  </tr>
                </thead>
                <tbody>
                  {data.cuotas_pendientes.map((c, i) => (
                    <tr key={i} className="border-t border-border hover:bg-card transition-colors">
                      <td className="px-5 py-3 text-text-primary">{c.descripcion || '—'}</td>
                      <td className="px-5 py-3 text-right text-text-secondary">{c.cuotas_restantes}</td>
                      <td className="px-5 py-3 text-right font-semibold text-text-primary">{formatCurrency(c.monto_cuota)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
