// =============================================================
// Lógica de cálculo de estado operativo — DESACOPLADA
// No accede a la BD directamente; recibe los datos ya resueltos.
// =============================================================

import type {
  EstadoOperativo,
  EstadoServicio,
  Empleado,
  Vehiculo,
  Servicio,
  Sustitucion,
  Ausencia,
  Incidencia,
  MotivoEstado,
} from '@/types'

const DIAS_ALERTA_VENCIMIENTO = 30

// ---------------------------------------------------------------
// Helpers de fecha
// ---------------------------------------------------------------
function parseDate(iso: string): Date {
  return new Date(iso + 'T00:00:00Z')
}

function estaEnRango(fecha: Date, inicio: string, fin: string): boolean {
  const d = fecha.getTime()
  return d >= parseDate(inicio).getTime() && d <= parseDate(fin).getTime()
}

function diasHasta(fecha: Date, vencimiento: string): number {
  const diff = parseDate(vencimiento).getTime() - fecha.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ---------------------------------------------------------------
// Parámetros de entrada para el cálculo
// ---------------------------------------------------------------
export interface DatosCalculo {
  servicio: Servicio
  fecha: Date
  empleadoBase: Empleado
  vehiculoBase: Vehiculo
  sustitucionEmpleado: Sustitucion | null  // activa en esa fecha
  sustitucionVehiculo: Sustitucion | null  // activa en esa fecha
  empleadoEfectivo: Empleado              // base o sustituto
  vehiculoEfectivo: Vehiculo              // base o sustituto
  ausenciasEmpleado: Ausencia[]           // del empleado efectivo en esa fecha
  incidenciasVehiculo: Incidencia[]       // del vehículo efectivo activas en esa fecha
}

// ---------------------------------------------------------------
// Función principal de cálculo — pura y testeable
// ---------------------------------------------------------------
export function calcularEstadoServicio(datos: DatosCalculo): EstadoServicio {
  const motivos: MotivoEstado[] = []
  const { fecha, empleadoEfectivo, vehiculoEfectivo } = datos
  const fechaISO = fecha.toISOString().split('T')[0]

  // --- CAUSAS DE NO_OPERATIVO ---

  // 1. Empleado ausente en esa fecha
  const ausenciaActiva = datos.ausenciasEmpleado.find((a) =>
    estaEnRango(fecha, a.fecha_inicio, a.fecha_fin)
  )
  if (ausenciaActiva) {
    motivos.push({
      codigo: 'EMPLEADO_AUSENTE',
      descripcion: `Empleado ${empleadoEfectivo.nombre} ${empleadoEfectivo.apellidos} ausente (${ausenciaActiva.tipo})`,
    })
  }

  // 2. Vehículo con incidencia grave o en taller
  const incidenciaGrave = datos.incidenciasVehiculo.find(
    (i) => i.gravedad === 'grave' && estaEnRango(fecha, i.fecha_inicio, i.fecha_fin ?? '9999-12-31')
  )
  if (incidenciaGrave) {
    motivos.push({
      codigo: 'VEHICULO_INCIDENCIA_GRAVE',
      descripcion: `Vehículo ${vehiculoEfectivo.matricula}: ${incidenciaGrave.descripcion}`,
    })
  }

  // 3. ITV vencida
  const diasITV = diasHasta(fecha, vehiculoEfectivo.itv_vencimiento)
  if (diasITV < 0) {
    motivos.push({
      codigo: 'ITV_VENCIDA',
      descripcion: `ITV vencida el ${vehiculoEfectivo.itv_vencimiento} (hace ${Math.abs(diasITV)} días)`,
    })
  }

  // 4. Seguro vencido
  const diasSeguro = diasHasta(fecha, vehiculoEfectivo.seguro_vencimiento)
  if (diasSeguro < 0) {
    motivos.push({
      codigo: 'SEGURO_VENCIDO',
      descripcion: `Seguro vencido el ${vehiculoEfectivo.seguro_vencimiento} (hace ${Math.abs(diasSeguro)} días)`,
    })
  }

  // Si hay cualquier causa NO_OPERATIVO → estado final
  const hayNoOperativo = motivos.some((m) =>
    ['EMPLEADO_AUSENTE', 'VEHICULO_INCIDENCIA_GRAVE', 'ITV_VENCIDA', 'SEGURO_VENCIDO'].includes(m.codigo)
  )
  if (hayNoOperativo) {
    return buildEstado(datos, fechaISO, 'NO_OPERATIVO', motivos)
  }

  // --- CAUSAS DE EN_RIESGO ---

  // 5. ITV vence en menos de DIAS_ALERTA días
  if (diasITV >= 0 && diasITV <= DIAS_ALERTA_VENCIMIENTO) {
    motivos.push({
      codigo: 'ITV_PROXIMA',
      descripcion: `ITV vence en ${diasITV} días (${vehiculoEfectivo.itv_vencimiento})`,
    })
  }

  // 6. Seguro vence en menos de DIAS_ALERTA días
  if (diasSeguro >= 0 && diasSeguro <= DIAS_ALERTA_VENCIMIENTO) {
    motivos.push({
      codigo: 'SEGURO_PROXIMO',
      descripcion: `Seguro vence en ${diasSeguro} días (${vehiculoEfectivo.seguro_vencimiento})`,
    })
  }

  // 7. Incidencia leve abierta
  const incidenciaLeve = datos.incidenciasVehiculo.find(
    (i) => i.gravedad === 'leve' && estaEnRango(fecha, i.fecha_inicio, i.fecha_fin ?? '9999-12-31')
  )
  if (incidenciaLeve) {
    motivos.push({
      codigo: 'VEHICULO_INCIDENCIA_LEVE',
      descripcion: `Vehículo ${vehiculoEfectivo.matricula}: incidencia leve abierta - ${incidenciaLeve.descripcion}`,
    })
  }

  const hayEnRiesgo = motivos.length > 0
  if (hayEnRiesgo) {
    return buildEstado(datos, fechaISO, 'EN_RIESGO', motivos)
  }

  return buildEstado(datos, fechaISO, 'OPERATIVO', [])
}

function buildEstado(
  datos: DatosCalculo,
  fechaISO: string,
  estado: EstadoOperativo,
  motivos: MotivoEstado[]
): EstadoServicio {
  return {
    servicio_id: datos.servicio.id,
    fecha: fechaISO,
    estado,
    motivos,
    empleado_efectivo: datos.empleadoEfectivo,
    vehiculo_efectivo: datos.vehiculoEfectivo,
    sustitucion_empleado: datos.sustitucionEmpleado,
    sustitucion_vehiculo: datos.sustitucionVehiculo,
  }
}
