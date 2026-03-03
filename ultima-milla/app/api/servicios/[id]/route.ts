import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { calcularEstadoParaFecha } from '@/lib/queries'

// GET /api/servicios/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id)
  const res = await pool.query(
    `SELECT s.*,
       row_to_json(e.*) AS empleado_base,
       row_to_json(v.*) AS vehiculo_base
     FROM servicios s
     JOIN empleados e ON s.empleado_base_id = e.id
     JOIN vehiculos v ON s.vehiculo_base_id  = v.id
     WHERE s.id = $1`,
    [id]
  )
  if (res.rowCount === 0) {
    return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
  }
  return NextResponse.json(res.rows[0])
}

// PATCH /api/servicios/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id)
  const body = await req.json()
  const { descripcion, zona, empleado_base_id, vehiculo_base_id, activo } = body

  const res = await pool.query(
    `UPDATE servicios SET
       descripcion      = COALESCE($1, descripcion),
       zona             = COALESCE($2, zona),
       empleado_base_id = COALESCE($3, empleado_base_id),
       vehiculo_base_id = COALESCE($4, vehiculo_base_id),
       activo           = COALESCE($5, activo)
     WHERE id = $6
     RETURNING *`,
    [descripcion, zona, empleado_base_id, vehiculo_base_id, activo, id]
  )
  if (res.rowCount === 0) {
    return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
  }
  return NextResponse.json(res.rows[0])
}
