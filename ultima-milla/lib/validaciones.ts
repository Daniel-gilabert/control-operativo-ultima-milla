// =============================================================
// Validaciones de negocio: solapamiento de fechas
// =============================================================

import pool from '@/lib/db'

export async function validarSinSolapamientoSustitucion(
  servicioId: number,
  tipo: 'empleado' | 'vehiculo',
  fechaInicio: string,
  fechaFin: string,
  excludeId?: number
): Promise<boolean> {
  const res = await pool.query(
    `SELECT id FROM sustituciones
     WHERE servicio_id = $1
       AND tipo = $2
       AND ($3::date, $4::date) OVERLAPS (fecha_inicio, fecha_fin + interval '1 day')
       ${excludeId ? 'AND id != $5' : ''}`,
    excludeId
      ? [servicioId, tipo, fechaInicio, fechaFin, excludeId]
      : [servicioId, tipo, fechaInicio, fechaFin]
  )
  return res.rowCount === 0  // true = no hay solapamiento
}

export async function validarSinSolapamientoAusencia(
  empleadoId: number,
  fechaInicio: string,
  fechaFin: string,
  excludeId?: number
): Promise<boolean> {
  const res = await pool.query(
    `SELECT id FROM ausencias
     WHERE empleado_id = $1
       AND ($2::date, $3::date) OVERLAPS (fecha_inicio, fecha_fin + interval '1 day')
       ${excludeId ? 'AND id != $4' : ''}`,
    excludeId
      ? [empleadoId, fechaInicio, fechaFin, excludeId]
      : [empleadoId, fechaInicio, fechaFin]
  )
  return res.rowCount === 0
}

export function validarFechaISO(fecha: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha) && !isNaN(Date.parse(fecha))
}
