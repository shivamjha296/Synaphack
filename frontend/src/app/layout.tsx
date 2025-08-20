import './globals.css'
import { Inter, Poppins, Space_Grotesk } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })
const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins'
})
const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-space-grotesk'
})

export const metadata = {
  title: 'Build2Skill - Advanced Hackathon Platform',
  description: 'Build2Skill - The most advanced platform for hosting, participating, and judging hackathons. Where brilliant minds collaborate to build the future.',
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${poppins.variable} ${spaceGrotesk.variable}`}>
        {children}
      </body>
    </html>
  )
}
