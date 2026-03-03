'use client'

import { useEffect, useState } from 'react'
import type { EstadoOperativo } from '@/types'

interface ServicioConEstado {
  id: number
  codigo: string
  descripcion: string
  zona: string | null
  empleado_base_nombre: string
  vehiculo_base_matricula: string
  estado?: EstadoOperativo
}

const BADGE: Record<EstadoOperativo, string> = {
  OPERATIVO:    'bg-green-100 text-green-700 border-green-200',
  EN_RIESGO:    'bg-yellow-100 text-yellow-700 border-yellow-200',
  NO_OPERATIVO: 'bg-red-100 text-red-700 border-red-200',
}

export default function ServiciosPage() {
  const today = new Date().toISOString().split('T')[0]
  const [servicios, setServicios] = useState<ServicioConEstado[]>([])
  const [form, setForm] = useState({
    codigo: '', descripcion: '', zona: '',
    empleado_base_id: '', vehiculo_base_id: '',
  })
  const [empleados, setEmpleados] = useState<{ id: number; nombre: string; apellidos: string }[]>([])
  const [vehiculos, setVehiculos] = useState<{ id: number; matricula: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fecha, setFecha] = useState(today)

  const load = async () => {
    const [s, e, v] = await Promise.all([
      fetch('/api/servicios').then((r) => r.json()),
      fetch('/api/empleados').then((r) => r.json()),
      fetch('/api/vehiculos').then((r) => r.json()),
    ])
    setServicios(s)
    setEmpleados(e)
    setVehiculos(v)
    // Cargar estados para la fecha
    const estados = await Promise.all(
      s.map((sv: ServicioConEstado) =>
        fetch(`/api/servicios/${sv.id}/estado?fecha=${fecha}`)
          .then((r) => r.json())
          .then((est) => ({ id: sv.id, estado: est.estado as EstadoOperativo }))
          .catch(() => ({ id: sv.id, estado: undefined }))
      )
    )
    setServicios((prev) =>
      prev.map((sv) => ({ ...sv, estado: estados.find((e) => e.id === sv.id)?.estado }))
    )
  }

  useEffect(() => { load() }, [fecha])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch('/api/servicios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        empleado_base_id: parseInt(form.empleado_base_id),
        vehiculo_base_id: parseInt(form.vehiculo_base_id),
      }),
    })
    if (!res.ok) {
      setError((await res.json()).error)
    } else {
      setForm({ codigo: '', descripcion: '', zona: '', empleado_base_id: '', vehiculo_base_id: '' })
      await load()
    }
    setSaving(false)
  }

  return (
    <PageLayout title="Servicios" back="/">
      {/* Selector de fecha */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Ver estado para:</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Formulario nuevo servicio */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Nuevo servicio</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Código *" value={form.codigo} onChange={(v) => setForm({ ...form, codigo: v })} />
          <Field label="Descripción *" value={form.descripcion} onChange={(v) => setForm({ ...form, descripcion: v })} />
          <Field label="Zona" value={form.zona} onChange={(v) => setForm({ ...form, zona: v })} />
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Empleado base *</label>
            <select
              value={form.empleado_base_id}
              onChange={(e) => setForm({ ...form, empleado_base_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Seleccionar...</option>
              {empleados.map((e) => (
                <option key={e.id} value={e.id}>{e.apellidos}, {e.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Vehículo base *</label>
            <select
              value={form.vehiculo_base_id}
              onChange={(e) => setForm({ ...form, vehiculo_base_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Seleccionar...</option>
              {vehiculos.map((v) => (
                <option key={v.id} value={v.id}>{v.matricula}</option>
              ))}
            </select>
          </div>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Crear servicio'}
        </button>
      </form>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-6 py-3 text-left">Código</th>
              <th className="px-6 py-3 text-left">Descripción</th>
              <th className="px-6 py-3 text-left">Zona</th>
              <th className="px-6 py-3 text-left">Empleado base</th>
              <th className="px-6 py-3 text-left">Vehículo base</th>
              <th className="px-6 py-3 text-left">Estado ({fecha})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {servicios.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-mono font-medium">{s.codigo}</td>
                <td className="px-6 py-3">{s.descripcion}</td>
                <td className="px-6 py-3 text-gray-500">{s.zona ?? '—'}</td>
                <td className="px-6 py-3">{s.empleado_base_nombre}</td>
                <td className="px-6 py-3 font-mono">{s.vehiculo_base_matricula}</td>
                <td className="px-6 py-3">
                  {s.estado ? (
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs border ${BADGE[s.estado]}`}>
                      {s.estado.replace('_', ' ')}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageLayout>
  )
}

function PageLayout({ title, children, back }: { title: string; children: React.ReactNode; back?: string }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {back && <a href={back} className="text-gray-400 hover:text-gray-600 text-sm">← Volver</a>}
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          </div>
          <nav className="flex gap-4 text-sm font-medium text-gray-600">
            <a href="/" className="hover:text-gray-900">Dashboard</a>
            <a href="/servicios" className="hover:text-gray-900">Servicios</a>
            <a href="/empleados" className="hover:text-gray-900">Empleados</a>
            <a href="/vehiculos" className="hover:text-gray-900">Vehículos</a>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">{children}</main>
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />
    </div>
  )
}
