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
      <body className="">
      <AuthProvider>
          <NavBarItem />
      </AuthProvider>
      {children}
      </body>
    </html>
  )
}
