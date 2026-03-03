import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { validarSinSolapamientoAusencia, validarFechaISO } from '@/lib/validaciones'
import type { CreateAusenciaPayload } from '@/types'

export async function GET(req: NextRequest) {
  const empleadoId = req.nextUrl.searchParams.get('empleado_id')
  const query = empleadoId
    ? `SELECT a.*, e.nombre || ' ' || e.apellidos AS empleado_nombre
       FROM ausencias a JOIN empleados e ON a.empleado_id = e.id
       WHERE a.empleado_id = $1 ORDER BY a.fecha_inicio DESC`
    : `SELECT a.*, e.nombre || ' ' || e.apellidos AS empleado_nombre
       FROM ausencias a JOIN empleados e ON a.empleado_id = e.id
       ORDER BY a.fecha_inicio DESC`
  const res = await pool.query(query, empleadoId ? [empleadoId] : [])
  return NextResponse.json(res.rows)
}

export async function POST(req: NextRequest) {
  const body: CreateAusenciaPayload = await req.json()
  const { empleado_id, fecha_inicio, fecha_fin, tipo, observaciones } = body

  if (!empleado_id || !fecha_inicio || !fecha_fin || !tipo) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }
  if (!validarFechaISO(fecha_inicio) || !validarFechaISO(fecha_fin)) {
    return NextResponse.json({ error: 'Formato de fecha inválido' }, { status: 400 })
  }
  if (fecha_fin < fecha_inicio) {
    return NextResponse.json({ error: 'fecha_fin debe ser >= fecha_inicio' }, { status: 400 })
  }

  const sinSolapamiento = await validarSinSolapamientoAusencia(empleado_id, fecha_inicio, fecha_fin)
  if (!sinSolapamiento) {
    return NextResponse.json(
      { error: 'Ya existe una ausencia del empleado que se solapa en ese rango de fechas' },
      { status: 409 }
    )
  }

  const res = await pool.query(
    `INSERT INTO ausencias (empleado_id, fecha_inicio, fecha_fin, tipo, observaciones)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [empleado_id, fecha_inicio, fecha_fin, tipo, observaciones ?? null]
  )
  return NextResponse.json(res.rows[0], { status: 201 })
}
