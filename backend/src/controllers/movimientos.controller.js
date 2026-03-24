import supabase from '../config/supabase.js';

/**
 * CU02 - Registrar Movimiento Manual.
 * Invoca la función transaccional PL/pgSQL 'registrar_movimiento' vía supabase.rpc().
 * La función garantiza atomicidad ACID: INSERT movimiento + UPDATE saldo_o_limite.
 */
export const createMovimiento = async (req, res) => {
  try {
    const { producto_bancario_id, categoria_id, monto, fecha, tipo, descripcion } = req.body;

    // Llamar a la función transaccional en PostgreSQL
    const { data, error } = await supabase.rpc('registrar_movimiento', {
      p_producto_bancario_id: producto_bancario_id,
      p_categoria_id: categoria_id,
      p_monto: monto,
      p_fecha: fecha,
      p_tipo: tipo,
      p_descripcion: descripcion || null
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({
      message: 'Movimiento registrado exitosamente',
      movimiento_id: data
    });
  } catch (err) {
    console.error('Error en createMovimiento:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
