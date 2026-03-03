import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import type { CreateIncidenciaPayload } from '@/types'
import { validarFechaISO } from '@/lib/validaciones'

export async function GET(req: NextRequest) {
  const vehiculoId = req.nextUrl.searchParams.get('vehiculo_id')
  const query = vehiculoId
    ? `SELECT i.*, v.matricula FROM incidencias i JOIN vehiculos v ON i.vehiculo_id = v.id
       WHERE i.vehiculo_id = $1 ORDER BY i.fecha_inicio DESC`
    : `SELECT i.*, v.matricula FROM incidencias i JOIN vehiculos v ON i.vehiculo_id = v.id
       ORDER BY i.fecha_inicio DESC`
  const res = await pool.query(query, vehiculoId ? [vehiculoId] : [])
  return NextResponse.json(res.rows)
}

export async function POST(req: NextRequest) {
  const body: CreateIncidenciaPayload = await req.json()
  const { vehiculo_id, gravedad, descripcion, fecha_inicio, fecha_fin } = body

  if (!vehiculo_id || !gravedad || !descripcion || !fecha_inicio) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }
  if (!validarFechaISO(fecha_inicio)) {
    return NextResponse.json({ error: 'Formato de fecha inválido' }, { status: 400 })
  }

  const res = await pool.query(
    `INSERT INTO incidencias (vehiculo_id, gravedad, descripcion, fecha_inicio, fecha_fin)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [vehiculo_id, gravedad, descripcion, fecha_inicio, fecha_fin ?? null]
  )
  return NextResponse.json(res.rows[0], { status: 201 })
}

// PATCH para cerrar incidencia
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, fecha_fin } = body
  if (!id || !fecha_fin) {
    return NextResponse.json({ error: 'Se requiere id y fecha_fin' }, { status: 400 })
  }
  const res = await pool.query(
    `UPDATE incidencias SET fecha_fin = $1 WHERE id = $2 RETURNING *`,
    [fecha_fin, id]
  )
  return NextResponse.json(res.rows[0])
}
