import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Control Operativo - Última Milla',
  description: 'Sistema de control operativo de servicios de última milla',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  )
}
