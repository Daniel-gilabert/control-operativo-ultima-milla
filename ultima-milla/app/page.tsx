'use client'

import { useEffect, useState } from 'react'
import type { ResumenDashboard, EstadoServicioResumen, EstadoOperativo } from '@/types'

const ESTADO_CONFIG: Record<EstadoOperativo, { label: string; color: string; bg: string; dot: string }> = {
  OPERATIVO:    { label: 'Operativo',    color: 'text-green-700',  bg: 'bg-green-50  border-green-200', dot: 'bg-green-500'  },
  EN_RIESGO:    { label: 'En riesgo',    color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', dot: 'bg-yellow-400' },
  NO_OPERATIVO: { label: 'No operativo', color: 'text-red-700',    bg: 'bg-red-50    border-red-200',    dot: 'bg-red-500'    },
}

export default function DashboardPage() {
  const today = new Date().toISOString().split('T')[0]
  const [fecha, setFecha] = useState(today)
  const [data, setData] = useState<ResumenDashboard | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = async (f: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/dashboard?fecha=${f}`)
      if (!res.ok) throw new Error('Error al cargar el dashboard')
      setData(await res.json())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDashboard(fecha) }, [fecha])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Control Operativo</h1>
            <p className="text-sm text-gray-500">Servicios de última milla</p>
          </div>
          <nav className="flex gap-4 text-sm font-medium text-gray-600">
            <a href="/" className="text-blue-600 font-semibold">Dashboard</a>
            <a href="/servicios" className="hover:text-gray-900">Servicios</a>
            <a href="/empleados" className="hover:text-gray-900">Empleados</a>
            <a href="/vehiculos" className="hover:text-gray-900">Vehículos</a>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Selector de fecha */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Consultar estado para:</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          {fecha !== today && (
            <button
              onClick={() => setFecha(today)}
              className="text-xs text-blue-600 hover:underline"
            >
              Volver a hoy
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20 text-gray-400 text-sm">Cargando...</div>
        ) : data && (
          <>
            {/* KPIs semáforo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KpiCard
                label="Operativos"
                value={data.operativos}
                total={data.total}
                color="green"
              />
              <KpiCard
                label="En riesgo"
                value={data.en_riesgo}
                total={data.total}
                color="yellow"
              />
              <KpiCard
                label="No operativos"
                value={data.no_operativos}
                total={data.total}
                color="red"
              />
            </div>

            {/* Tabla de servicios */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">
                  Estado de servicios — {fecha}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-6 py-3 text-left">Código</th>
                      <th className="px-6 py-3 text-left">Descripción</th>
                      <th className="px-6 py-3 text-left">Zona</th>
                      <th className="px-6 py-3 text-left">Empleado</th>
                      <th className="px-6 py-3 text-left">Vehículo</th>
                      <th className="px-6 py-3 text-left">Estado</th>
                      <th className="px-6 py-3 text-left">Motivos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.servicios.map((s) => (
                      <ServicioRow key={s.id} servicio={s} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function KpiCard({ label, value, total, color }: {
  label: string
  value: number
  total: number
  color: 'green' | 'yellow' | 'red'
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  const styles = {
    green:  { bar: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-100' },
    yellow: { bar: 'bg-yellow-400', text: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-100' },
    red:    { bar: 'bg-red-500',    text: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-100'    },
  }[color]

  return (
    <div className={`rounded-xl border ${styles.border} ${styles.bg} p-6`}>
      <div className={`text-4xl font-bold ${styles.text}`}>{value}</div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
      <div className="mt-3 h-2 bg-white rounded-full overflow-hidden">
        <div className={`h-full ${styles.bar} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-gray-400 mt-1">{pct}% del total ({total})</div>
    </div>
  )
}

function ServicioRow({ servicio }: { servicio: EstadoServicioResumen }) {
  const cfg = ESTADO_CONFIG[servicio.estado]
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 font-mono font-medium text-gray-800">{servicio.codigo}</td>
      <td className="px-6 py-4 text-gray-700">{servicio.descripcion}</td>
      <td className="px-6 py-4 text-gray-500">{servicio.zona ?? '—'}</td>
      <td className="px-6 py-4 text-gray-700">{servicio.empleado_nombre}</td>
      <td className="px-6 py-4 font-mono text-gray-600">{servicio.vehiculo_matricula}</td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}>
          <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </td>
      <td className="px-6 py-4 max-w-xs">
        {servicio.motivos.length === 0 ? (
          <span className="text-gray-400 text-xs">—</span>
        ) : (
          <ul className="space-y-0.5">
            {servicio.motivos.map((m) => (
              <li key={m.codigo} className="text-xs text-gray-600">{m.descripcion}</li>
            ))}
          </ul>
        )}
      </td>
    </tr>
  )
}
