import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { login } from '../server-fns/auth'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setIsLoading(true)

    try {
      const result = await login({
        data: {
          email,
          password,
        },
      })

      console.log('Result login:', result)

      if (result && result.success) {
        // Redirect berdasarkan role (contoh: ke dashboard Ustadz atau Santri)
        // Saat ini kita arahkan ke halaman utama/dashboard sementara
        navigate({ to: '/' })
      } else {
        setErrorMsg(result?.error?.message || 'Terjadi kesalahan saat masuk.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal terhubung ke server.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-sm border-gray-100 bg-white">
        <CardHeader className="space-y-3 text-center pb-8">
          <div className="mx-auto bg-emerald-600 h-12 w-12 rounded-xl flex items-center justify-center">
            {/* Ikon Quran/Buku Sederhana */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
            Masuk ke TahfidzKu
          </CardTitle>
          <CardDescription className="text-gray-500 text-sm">
            Masukkan Nomor WhatsApp/Email dan PIN Anda
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-5">
            {errorMsg && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg text-center font-medium">
                {errorMsg}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">No. WhatsApp / Email</Label>
              <Input
                id="email"
                type="text"
                placeholder="Misal: 08123456789 atau ustadz@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border-gray-200 focus-visible:ring-emerald-500 rounded-xl"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pin" className="text-gray-700 font-medium">PIN Masuk</Label>
              <Input
                id="pin"
                type="password"
                placeholder="Masukkan 6 digit PIN"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 border-gray-200 focus-visible:ring-emerald-500 rounded-xl text-center tracking-widest text-lg"
                maxLength={6}
                required
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col pt-4">
            <Button 
              type="submit" 
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all font-semibold text-base"
              disabled={isLoading}
            >
              {isLoading ? 'Memeriksa...' : 'Masuk Sekarang'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
