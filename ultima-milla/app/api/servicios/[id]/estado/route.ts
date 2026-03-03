import { NextRequest, NextResponse } from 'next/server'
import { calcularEstadoParaFecha } from '@/lib/queries'
import { validarFechaISO } from '@/lib/validaciones'

// GET /api/servicios/[id]/estado?fecha=YYYY-MM-DD
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id)
  const fecha = req.nextUrl.searchParams.get('fecha') ?? new Date().toISOString().split('T')[0]

  if (!validarFechaISO(fecha)) {
    return NextResponse.json({ error: 'Formato de fecha inválido. Use YYYY-MM-DD' }, { status: 400 })
  }

  const estado = await calcularEstadoParaFecha(id, fecha)
  if (!estado) {
    return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
  }
  return NextResponse.json(estado)
}
