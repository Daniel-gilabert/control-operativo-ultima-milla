// =============================================================
// Capa de acceso a datos: consultas SQL para el cálculo de estado
// =============================================================

import pool from '@/lib/db'
import type { Empleado, Vehiculo, Servicio, Sustitucion, Ausencia, Incidencia } from '@/types'
import { calcularEstadoServicio, DatosCalculo } from '@/lib/calcularEstado'
import type { EstadoServicio } from '@/types'

// ---------------------------------------------------------------
// Obtener servicio con sus asignaciones base
// ---------------------------------------------------------------
export async function getServicioConBase(servicioId: number): Promise<Servicio & {
  empleado_base: Empleado
  vehiculo_base: Vehiculo
} | null> {
  const res = await pool.query(
    `SELECT
       s.*,
       row_to_json(e.*) AS empleado_base,
       row_to_json(v.*) AS vehiculo_base
     FROM servicios s
     JOIN empleados e ON s.empleado_base_id = e.id
     JOIN vehiculos v ON s.vehiculo_base_id  = v.id
     WHERE s.id = $1 AND s.activo = TRUE`,
    [servicioId]
  )
  if (res.rowCount === 0) return null
  const row = res.rows[0]
  return { ...row, empleado_base: row.empleado_base, vehiculo_base: row.vehiculo_base }
}

// ---------------------------------------------------------------
// Sustitución activa para una fecha dada
// ---------------------------------------------------------------
export async function getSustitucionActiva(
  servicioId: number,
  tipo: 'empleado' | 'vehiculo',
  fecha: string
): Promise<Sustitucion | null> {
  const res = await pool.query(
    `SELECT * FROM sustituciones
     WHERE servicio_id = $1
       AND tipo = $2
       AND fecha_inicio <= $3::date
       AND fecha_fin    >= $3::date
     ORDER BY fecha_inicio DESC
     LIMIT 1`,
    [servicioId, tipo, fecha]
  )
  return res.rowCount! > 0 ? res.rows[0] : null
}

// ---------------------------------------------------------------
// Ausencias del empleado en una fecha
// ---------------------------------------------------------------
export async function getAusenciasEnFecha(
  empleadoId: number,
  fecha: string
): Promise<Ausencia[]> {
  const res = await pool.query(
    `SELECT * FROM ausencias
     WHERE empleado_id = $1
       AND fecha_inicio <= $2::date
       AND fecha_fin    >= $2::date`,
    [empleadoId, fecha]
  )
  return res.rows
}

// ---------------------------------------------------------------
// Incidencias activas del vehículo en una fecha
// ---------------------------------------------------------------
export async function getIncidenciasEnFecha(
  vehiculoId: number,
  fecha: string
): Promise<Incidencia[]> {
  const res = await pool.query(
    `SELECT * FROM incidencias
     WHERE vehiculo_id = $1
       AND fecha_inicio <= $2::date
       AND (fecha_fin IS NULL OR fecha_fin >= $2::date)`,
    [vehiculoId, fecha]
  )
  return res.rows
}

// ---------------------------------------------------------------
// Resolución del empleado efectivo (base o sustituto)
// ---------------------------------------------------------------
export async function getEmpleadoPorId(id: number): Promise<Empleado | null> {
  const res = await pool.query('SELECT * FROM empleados WHERE id = $1', [id])
  return res.rowCount! > 0 ? res.rows[0] : null
}

export async function getVehiculoPorId(id: number): Promise<Vehiculo | null> {
  const res = await pool.query('SELECT * FROM vehiculos WHERE id = $1', [id])
  return res.rowCount! > 0 ? res.rows[0] : null
}

// ---------------------------------------------------------------
// Función orquestadora: calcula el estado de un servicio en una fecha
// ---------------------------------------------------------------
export async function calcularEstadoParaFecha(
  servicioId: number,
  fechaISO: string
): Promise<EstadoServicio | null> {
  const servicio = await getServicioConBase(servicioId)
  if (!servicio) return null

  const [sustEmp, sustVeh] = await Promise.all([
    getSustitucionActiva(servicioId, 'empleado', fechaISO),
    getSustitucionActiva(servicioId, 'vehiculo', fechaISO),
  ])

  // Empleado efectivo
  const empleadoEfectivoId = sustEmp?.empleado_id ?? servicio.empleado_base_id
  const vehiculoEfectivoId = sustVeh?.vehiculo_id ?? servicio.vehiculo_base_id

  const [empleadoEfectivo, vehiculoEfectivo] = await Promise.all([
    sustEmp ? getEmpleadoPorId(empleadoEfectivoId) : Promise.resolve(servicio.empleado_base),
    sustVeh ? getVehiculoPorId(vehiculoEfectivoId) : Promise.resolve(servicio.vehiculo_base),
  ])

  if (!empleadoEfectivo || !vehiculoEfectivo) return null

  const [ausencias, incidencias] = await Promise.all([
    getAusenciasEnFecha(empleadoEfectivoId, fechaISO),
    getIncidenciasEnFecha(vehiculoEfectivoId, fechaISO),
  ])

  const datos: DatosCalculo = {
    servicio,
    fecha: new Date(fechaISO + 'T00:00:00Z'),
    empleadoBase: servicio.empleado_base,
    vehiculoBase: servicio.vehiculo_base,
    sustitucionEmpleado: sustEmp,
    sustitucionVehiculo: sustVeh,
    empleadoEfectivo,
    vehiculoEfectivo,
    ausenciasEmpleado: ausencias,
    incidenciasVehiculo: incidencias,
  }

  return calcularEstadoServicio(datos)
}

// ---------------------------------------------------------------
// Dashboard: estado de todos los servicios para una fecha
// ---------------------------------------------------------------
export async function calcularDashboard(fechaISO: string) {
  const res = await pool.query(
    `SELECT s.id FROM servicios s WHERE s.activo = TRUE ORDER BY s.codigo`
  )
  const estados = await Promise.all(
    res.rows.map((r) => calcularEstadoParaFecha(r.id, fechaISO))
  )

  const validos = estados.filter(Boolean) as Awaited<ReturnType<typeof calcularEstadoParaFecha>>[]

  const serviciosConInfo = await Promise.all(
    validos.map(async (e) => {
      if (!e) return null
      const s = await getServicioConBase(e.servicio_id)
      return {
        id: e.servicio_id,
        codigo: s?.codigo ?? '',
        descripcion: s?.descripcion ?? '',
        zona: s?.zona ?? null,
        estado: e.estado,
        motivos: e.motivos,
        empleado_nombre: `${e.empleado_efectivo.nombre} ${e.empleado_efectivo.apellidos}`,
        vehiculo_matricula: e.vehiculo_efectivo.matricula,
      }
    })
  )

  const lista = serviciosConInfo.filter(Boolean)
  return {
    fecha: fechaISO,
    total: lista.length,
    operativos:    lista.filter((s) => s!.estado === 'OPERATIVO').length,
    en_riesgo:     lista.filter((s) => s!.estado === 'EN_RIESGO').length,
    no_operativos: lista.filter((s) => s!.estado === 'NO_OPERATIVO').length,
    servicios: lista,
  }
}
