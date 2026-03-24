import { useState, useEffect } from 'react';
import { Wallet, TrendingDown, CreditCard, RefreshCw } from 'lucide-react';
import api from '../services/api.js';
import DashboardCard from '../components/DashboardCard.jsx';

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
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-text-secondary text-sm">Cargando datos financieros…</p>
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
        {data.gastos_por_categoria?.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Gastos por Categoría</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.gastos_por_categoria.map((g) => (
                <div key={g.categoria} className="flex items-center justify-between rounded-xl bg-card border border-border px-5 py-4">
                  <span className="text-text-secondary text-sm">{g.categoria}</span>
                  <span className="font-semibold text-text-primary">{formatCurrency(g.total)}</span>
                </div>
              ))}
            </div>
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
