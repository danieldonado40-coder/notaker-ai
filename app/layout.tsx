import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Notaker · Notas & Asistente IA',
  description:
    'App de notas estilo iOS con diseño Liquid Blue, dictado de voz y sincronización automática de actividades con Notion.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Notaker',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#060b1f',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>{children}</body>
    </html>
  )
}
