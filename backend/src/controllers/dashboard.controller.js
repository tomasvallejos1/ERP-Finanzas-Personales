import supabase from '../config/supabase.js';

/**
 * CU04 - Visualizar Dashboard.
 * Ejecuta 3 consultas RPC de agregación en paralelo (Promise.all)
 * para obtener patrimonio, gastos por categoría y cuotas pendientes.
 */
export const getDashboard = async (req, res) => {
  try {
    // Ejecutar las 3 consultas de agregación en paralelo
    const [patrimonioRes, gastosRes, cuotasRes] = await Promise.all([
      supabase.rpc('obtener_patrimonio_total'),
      supabase.rpc('obtener_gastos_por_categoria'),
      supabase.rpc('obtener_cuotas_pendientes')
    ]);

    // Verificar errores en cualquiera de las consultas
    if (patrimonioRes.error) throw patrimonioRes.error;
    if (gastosRes.error) throw gastosRes.error;
    if (cuotasRes.error) throw cuotasRes.error;

    return res.status(200).json({
      patrimonio_total: patrimonioRes.data,
      gastos_por_categoria: gastosRes.data,
      cuotas_pendientes: cuotasRes.data
    });
  } catch (err) {
    console.error('Error en getDashboard:', err);
    return res.status(500).json({ error: err.message || 'Error interno del servidor' });
  }
};
