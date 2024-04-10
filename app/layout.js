import './globals.css'
import {NavBarItem} from '@/components/navbar'
import AuthProvider from '@/components/authProvider'

export const metadata = {
  title: 'Stock Vista',
  description: 'A stock market analysis tool',
  // meta charset="utf-8"
  charSet: 'utf-8',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="vh-100 vw-100 mw-100 d-flex flex-column">
      <AuthProvider>
          <NavBarItem />
      </AuthProvider>
      {children}
      </body>
    </html>
  )
}
