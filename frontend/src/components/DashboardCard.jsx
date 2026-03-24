import clsx from 'clsx';

/**
 * DashboardCard — Tarjeta reutilizable para métricas financieras.
 * Props:
 *   title    {string}   — Etiqueta descriptiva de la métrica
 *   value    {string}   — Valor formateado a mostrar
 *   icon     {Component}— Componente de ícono de lucide-react
 *   trend    {'up'|'down'|null} — Indicador de tendencia vs mes anterior
 *   className {string}  — Clases adicionales opcionales
 */
export default function DashboardCard({ title, value, icon: Icon, trend, className }) {
  const isPositive = trend === 'up';

  return (
    <article className={clsx(
      'group relative overflow-hidden rounded-2xl p-6',
      'bg-card border border-border',
      'hover:bg-card-hover hover:border-accent/30',
      'transition-all duration-300 ease-out cursor-default',
      'hover:shadow-[0_0_40px_rgba(56,189,248,0.07)]',
      className
    )}>
      {/* Gradiente sutil en hover (glassmorfismo) */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-secondary truncate mb-2">{title}</p>
          <p className="text-2xl font-bold text-text-primary tracking-tight leading-none">{value}</p>
        </div>

        {Icon && (
          <div className="shrink-0 p-3 rounded-xl bg-accent/10 text-accent group-hover:scale-110 group-hover:bg-accent/20 transition-all duration-300">
            <Icon size={22} strokeWidth={1.75} />
          </div>
        )}
      </div>

      {trend && (
        <p className={clsx(
          'relative z-10 mt-4 text-xs font-semibold flex items-center gap-1',
          isPositive ? 'text-success' : 'text-danger'
        )}>
          <span>{isPositive ? '▲' : '▼'}</span>
          <span>vs. mes anterior</span>
        </p>
      )}
    </article>
  );
}
