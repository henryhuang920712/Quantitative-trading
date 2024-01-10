import './globals.css'
import {NavBarItem} from '@/components/stock_number/navbar'

export const metadata = {
  title: 'Stock Vista',
  description: 'A stock market analysis tool',
  // meta charset="utf-8"
  charSet: 'utf-8',
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
