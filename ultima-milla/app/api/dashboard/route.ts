import { NextRequest, NextResponse } from 'next/server'
import { calcularDashboard } from '@/lib/queries'
import { validarFechaISO } from '@/lib/validaciones'

// GET /api/dashboard?fecha=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const fecha = req.nextUrl.searchParams.get('fecha') ?? new Date().toISOString().split('T')[0]

  if (!validarFechaISO(fecha)) {
    return NextResponse.json({ error: 'Formato de fecha inválido. Use YYYY-MM-DD' }, { status: 400 })
  }

  const resumen = await calcularDashboard(fecha)
  return NextResponse.json(resumen)
}
