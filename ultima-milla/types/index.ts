// =============================================================
// Tipos del dominio - Control Operativo Última Milla
// =============================================================

export type EstadoOperativo = 'OPERATIVO' | 'EN_RIESGO' | 'NO_OPERATIVO'

// ---------------------------------------------------------------
// Entidades base
// ---------------------------------------------------------------
export interface Empleado {
  id: number
  nombre: string
  apellidos: string
  dni: string
  telefono: string | null
  email: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Vehiculo {
  id: number
  matricula: string
  marca: string
  modelo: string
  anio: number | null
  itv_vencimiento: string   // ISO date YYYY-MM-DD
  seguro_vencimiento: string
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Servicio {
  id: number
  codigo: string
  descripcion: string
  zona: string | null
  empleado_base_id: number
  vehiculo_base_id: number
  activo: boolean
  created_at: string
  updated_at: string
  // Joins opcionales
  empleado_base?: Empleado
  vehiculo_base?: Vehiculo
}

export interface Sustitucion {
  id: number
  servicio_id: number
  tipo: 'empleado' | 'vehiculo'
  empleado_id: number | null
  vehiculo_id: number | null
  fecha_inicio: string
  fecha_fin: string
  motivo: string | null
  created_at: string
  updated_at: string
}

export interface Ausencia {
  id: number
  empleado_id: number
  fecha_inicio: string
  fecha_fin: string
  tipo: string
  observaciones: string | null
  created_at: string
  updated_at: string
}

export interface Incidencia {
  id: number
  vehiculo_id: number
  gravedad: 'leve' | 'grave'
  descripcion: string
  fecha_inicio: string
  fecha_fin: string | null  // null = abierta
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------
// Resultado del cálculo de estado
// ---------------------------------------------------------------
export interface MotivoEstado {
  codigo: string
  descripcion: string
}

export interface EstadoServicio {
  servicio_id: number
  fecha: string            // fecha consultada YYYY-MM-DD
  estado: EstadoOperativo
  motivos: MotivoEstado[]  // causas que determinan el estado
  // Contexto de la fecha consultada
  empleado_efectivo: Empleado
  vehiculo_efectivo: Vehiculo
  sustitucion_empleado: Sustitucion | null
  sustitucion_vehiculo: Sustitucion | null
}

// ---------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------
export interface ResumenDashboard {
  fecha: string
  total: number
  operativos: number
  en_riesgo: number
  no_operativos: number
  servicios: EstadoServicioResumen[]
}

export interface EstadoServicioResumen {
  id: number
  codigo: string
  descripcion: string
  zona: string | null
  estado: EstadoOperativo
  motivos: MotivoEstado[]
  empleado_nombre: string
  vehiculo_matricula: string
}

// ---------------------------------------------------------------
// Payloads de API
// ---------------------------------------------------------------
export interface CreateServicioPayload {
  codigo: string
  descripcion: string
  zona?: string
  empleado_base_id: number
  vehiculo_base_id: number
}

export interface CreateSustitucionPayload {
  servicio_id: number
  tipo: 'empleado' | 'vehiculo'
  empleado_id?: number
  vehiculo_id?: number
  fecha_inicio: string
  fecha_fin: string
  motivo?: string
}

export interface CreateAusenciaPayload {
  empleado_id: number
  fecha_inicio: string
  fecha_fin: string
  tipo: string
  observaciones?: string
}

export interface CreateIncidenciaPayload {
  vehiculo_id: number
  gravedad: 'leve' | 'grave'
  descripcion: string
  fecha_inicio: string
  fecha_fin?: string
}
