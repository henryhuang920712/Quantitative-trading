import './globals.css'
import {NavBarItem} from '@/components/navbar'

export const metadata = {
  title: 'Stock Vista',
  description: 'A stock market analysis tool',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="vh-100 vw-100 d-flex flex-column">
      <NavBarItem />
      {children}
      </body>
    </html>
  )
}
