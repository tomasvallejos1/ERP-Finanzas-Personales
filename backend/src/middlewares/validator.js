/**
 * Middleware de validación para movimientos (CU02 << include >> Validar Datos).
 * Garantiza que el monto sea un número positivo y que todos los campos
 * obligatorios estén presentes antes de llegar al controlador.
 */
export const validateMovimiento = (req, res, next) => {
  const { producto_bancario_id, categoria_id, monto, fecha, tipo } = req.body;

  // Campos obligatorios
  if (!producto_bancario_id || !categoria_id || !monto || !fecha || !tipo) {
    return res.status(400).json({
      error: 'Campos obligatorios faltantes: producto_bancario_id, categoria_id, monto, fecha, tipo'
    });
  }

  // Monto debe ser numérico y positivo (RNF Integridad)
  if (typeof monto !== 'number' || monto <= 0) {
    return res.status(400).json({
      error: 'El monto debe ser un número positivo'
    });
  }

  // Tipo debe ser uno de los valores válidos del enum
  const tiposValidos = ['Ingreso', 'Gasto', 'Transferencia'];
  if (!tiposValidos.includes(tipo)) {
    return res.status(400).json({
      error: `Tipo inválido. Valores permitidos: ${tiposValidos.join(', ')}`
    });
  }

  next();
};
