import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  const res = await pool.query(
    `SELECT * FROM vehiculos WHERE activo = TRUE ORDER BY matricula`
  )
  return NextResponse.json(res.rows)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { matricula, marca, modelo, anio, itv_vencimiento, seguro_vencimiento } = body

  if (!matricula || !marca || !modelo || !itv_vencimiento || !seguro_vencimiento) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  const res = await pool.query(
    `INSERT INTO vehiculos (matricula, marca, modelo, anio, itv_vencimiento, seguro_vencimiento)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [matricula, marca, modelo, anio ?? null, itv_vencimiento, seguro_vencimiento]
  )
  return NextResponse.json(res.rows[0], { status: 201 })
}
