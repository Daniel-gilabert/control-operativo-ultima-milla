import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { validarSinSolapamientoSustitucion, validarFechaISO } from '@/lib/validaciones'
import type { CreateSustitucionPayload } from '@/types'

export async function GET(req: NextRequest) {
  const servicioId = req.nextUrl.searchParams.get('servicio_id')
  const query = servicioId
    ? `SELECT * FROM sustituciones WHERE servicio_id = $1 ORDER BY fecha_inicio DESC`
    : `SELECT * FROM sustituciones ORDER BY fecha_inicio DESC`
  const res = await pool.query(query, servicioId ? [servicioId] : [])
  return NextResponse.json(res.rows)
}

export async function POST(req: NextRequest) {
  const body: CreateSustitucionPayload = await req.json()
  const { servicio_id, tipo, empleado_id, vehiculo_id, fecha_inicio, fecha_fin, motivo } = body

  if (!servicio_id || !tipo || !fecha_inicio || !fecha_fin) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }
  if (!validarFechaISO(fecha_inicio) || !validarFechaISO(fecha_fin)) {
    return NextResponse.json({ error: 'Formato de fecha inválido' }, { status: 400 })
  }
  if (fecha_fin < fecha_inicio) {
    return NextResponse.json({ error: 'fecha_fin debe ser >= fecha_inicio' }, { status: 400 })
  }
  if (tipo === 'empleado' && !empleado_id) {
    return NextResponse.json({ error: 'Se requiere empleado_id para tipo empleado' }, { status: 400 })
  }
  if (tipo === 'vehiculo' && !vehiculo_id) {
    return NextResponse.json({ error: 'Se requiere vehiculo_id para tipo vehiculo' }, { status: 400 })
  }

  const sinSolapamiento = await validarSinSolapamientoSustitucion(
    servicio_id, tipo, fecha_inicio, fecha_fin
  )
  if (!sinSolapamiento) {
    return NextResponse.json(
      { error: 'Ya existe una sustitución del mismo tipo que se solapa en ese rango de fechas' },
      { status: 409 }
    )
  }

  const res = await pool.query(
    `INSERT INTO sustituciones (servicio_id, tipo, empleado_id, vehiculo_id, fecha_inicio, fecha_fin, motivo)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [servicio_id, tipo, empleado_id ?? null, vehiculo_id ?? null, fecha_inicio, fecha_fin, motivo ?? null]
  )
  return NextResponse.json(res.rows[0], { status: 201 })
}
