// INSTRUCCIÓN: Este archivo debe colocarse en:
//   app/api/servicios/route.ts
//
// El directorio "route.ts" dentro de app/api/servicios/ fue creado por error
// y debe eliminarse manualmente antes de crear este archivo.
//
// Pasos:
//   1. Abre una terminal en la carpeta del proyecto
//   2. Ejecuta: rmdir /s /q "app\api\servicios\route.ts"
//   3. Copia el contenido de este archivo a: app/api/servicios/route.ts

import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import type { CreateServicioPayload } from '@/types'

export async function GET() {
  const res = await pool.query(
    `SELECT
       s.*,
       e.nombre || ' ' || e.apellidos AS empleado_base_nombre,
       v.matricula AS vehiculo_base_matricula
     FROM servicios s
     JOIN empleados e ON s.empleado_base_id = e.id
     JOIN vehiculos v ON s.vehiculo_base_id  = v.id
     WHERE s.activo = TRUE
     ORDER BY s.codigo`
  )
  return NextResponse.json(res.rows)
}

export async function POST(req: NextRequest) {
  const body: CreateServicioPayload = await req.json()
  const { codigo, descripcion, zona, empleado_base_id, vehiculo_base_id } = body

  if (!codigo || !descripcion || !empleado_base_id || !vehiculo_base_id) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  const res = await pool.query(
    `INSERT INTO servicios (codigo, descripcion, zona, empleado_base_id, vehiculo_base_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [codigo, descripcion, zona ?? null, empleado_base_id, vehiculo_base_id]
  )
  return NextResponse.json(res.rows[0], { status: 201 })
}
