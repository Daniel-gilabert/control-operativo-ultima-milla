'use client'

import { useEffect, useState } from 'react'

interface Empleado {
  id: number
  nombre: string
  apellidos: string
  dni: string
  telefono: string | null
  email: string | null
}

export default function EmpleadosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [form, setForm] = useState({ nombre: '', apellidos: '', dni: '', telefono: '', email: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    const res = await fetch('/api/empleados')
    setEmpleados(await res.json())
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch('/api/empleados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      const j = await res.json()
      setError(j.error)
    } else {
      setForm({ nombre: '', apellidos: '', dni: '', telefono: '', email: '' })
      await load()
    }
    setSaving(false)
  }

  return (
    <PageLayout title="Empleados" back="/">
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Nuevo empleado</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre *" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} />
          <Field label="Apellidos *" value={form.apellidos} onChange={(v) => setForm({ ...form, apellidos: v })} />
          <Field label="DNI *" value={form.dni} onChange={(v) => setForm({ ...form, dni: v })} />
          <Field label="Teléfono" value={form.telefono} onChange={(v) => setForm({ ...form, telefono: v })} />
          <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Crear empleado'}
        </button>
      </form>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-6 py-3 text-left">Apellidos, Nombre</th>
              <th className="px-6 py-3 text-left">DNI</th>
              <th className="px-6 py-3 text-left">Teléfono</th>
              <th className="px-6 py-3 text-left">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {empleados.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium">{e.apellidos}, {e.nombre}</td>
                <td className="px-6 py-3 font-mono text-gray-600">{e.dni}</td>
                <td className="px-6 py-3 text-gray-600">{e.telefono ?? '—'}</td>
                <td className="px-6 py-3 text-gray-600">{e.email ?? '—'}</td>
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
        <div className="max-w-5xl mx-auto flex items-center justify-between">
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
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">{children}</main>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />
    </div>
  )
}
