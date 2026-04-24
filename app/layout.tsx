import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'neshama.site — 日本語の学び場',
  description: 'A personal sanctuary for Japanese language learning — grammar, vocabulary, reading, and culture.',
  openGraph: {
    title: 'neshama.site',
    description: '日本語の学び場 — A personal Japanese learning sanctuary',
    url: 'https://neshama.site',
    siteName: 'neshama.site',
    locale: 'ja_JP',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  )
}
