import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  const res = await pool.query(
    `SELECT * FROM empleados WHERE activo = TRUE ORDER BY apellidos, nombre`
  )
  return NextResponse.json(res.rows)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { nombre, apellidos, dni, telefono, email } = body

  if (!nombre || !apellidos || !dni) {
    return NextResponse.json({ error: 'nombre, apellidos y dni son obligatorios' }, { status: 400 })
  }

  const res = await pool.query(
    `INSERT INTO empleados (nombre, apellidos, dni, telefono, email)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [nombre, apellidos, dni, telefono ?? null, email ?? null]
  )
  return NextResponse.json(res.rows[0], { status: 201 })
}
