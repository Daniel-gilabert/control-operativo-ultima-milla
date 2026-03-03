'use client'

import { useEffect, useState } from 'react'

interface Vehiculo {
  id: number
  matricula: string
  marca: string
  modelo: string
  anio: number | null
  itv_vencimiento: string
  seguro_vencimiento: string
}

const today = new Date().toISOString().split('T')[0]

function vencimientoLabel(fecha: string) {
  const dias = Math.ceil((new Date(fecha + 'T00:00:00Z').getTime() - new Date(today + 'T00:00:00Z').getTime()) / 86400000)
  if (dias < 0) return { text: `Vencida (${Math.abs(dias)}d)`, cls: 'text-red-600 font-medium' }
  if (dias <= 30) return { text: `${dias}d`, cls: 'text-yellow-600 font-medium' }
  return { text: fecha, cls: 'text-gray-600' }
}

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [form, setForm] = useState({
    matricula: '', marca: '', modelo: '', anio: '',
    itv_vencimiento: '', seguro_vencimiento: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    const res = await fetch('/api/vehiculos')
    setVehiculos(await res.json())
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch('/api/vehiculos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, anio: form.anio ? parseInt(form.anio) : null }),
    })
    if (!res.ok) {
      setError((await res.json()).error)
    } else {
      setForm({ matricula: '', marca: '', modelo: '', anio: '', itv_vencimiento: '', seguro_vencimiento: '' })
      await load()
    }
    setSaving(false)
  }

  return (
    <PageLayout title="Vehículos" back="/">
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Nuevo vehículo</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {([
            ['Matrícula *', 'matricula'], ['Marca *', 'marca'], ['Modelo *', 'modelo'],
            ['Año', 'anio'], ['ITV vencimiento *', 'itv_vencimiento'], ['Seguro vencimiento *', 'seguro_vencimiento'],
          ] as [string, keyof typeof form][]).map(([label, key]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={key.includes('vencimiento') ? 'date' : key === 'anio' ? 'number' : 'text'}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          ))}
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Crear vehículo'}
        </button>
      </form>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-6 py-3 text-left">Matrícula</th>
              <th className="px-6 py-3 text-left">Vehículo</th>
              <th className="px-6 py-3 text-left">Año</th>
              <th className="px-6 py-3 text-left">ITV vence</th>
              <th className="px-6 py-3 text-left">Seguro vence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vehiculos.map((v) => {
              const itv = vencimientoLabel(v.itv_vencimiento)
              const seg = vencimientoLabel(v.seguro_vencimiento)
              return (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-mono font-medium">{v.matricula}</td>
                  <td className="px-6 py-3">{v.marca} {v.modelo}</td>
                  <td className="px-6 py-3 text-gray-500">{v.anio ?? '—'}</td>
                  <td className={`px-6 py-3 ${itv.cls}`}>{itv.text}</td>
                  <td className={`px-6 py-3 ${seg.cls}`}>{seg.text}</td>
                </tr>
              )
            })}
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
