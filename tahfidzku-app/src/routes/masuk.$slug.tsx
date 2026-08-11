import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { getTenantBySlug } from '../server-fns/tenant-by-slug'
import { login } from '../server-fns/auth'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'

export const Route = createFileRoute('/masuk/$slug')({
  loader: async ({ params }) => {
    return await getTenantBySlug({ data: { slug: params.slug } })
  },
  head: ({ loaderData, params }) => ({
    links: [
      {
        rel: 'manifest',
        href: `/api/manifest.webmanifest?slug=${params.slug}`,
      },
    ],
    meta: loaderData?.themeColor
      ? [
          {
            name: 'theme-color',
            content: loaderData.themeColor,
          },
        ]
      : [],
  }),
  component: MasukSlugPage,
})

function MasukSlugPage() {
  const tenant = Route.useLoaderData()
  const navigate = useNavigate()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const themeColor = tenant?.themeColor || '#047857'
  const namaLembaga = tenant?.namaLembaga || 'TahfidzKu'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setIsLoading(true)

    try {
      const result = await login({
        data: {
          identifier,
          password,
        },
      })

      if (result && result.success) {
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <Card className="w-full max-w-md shadow-sm border-slate-100 bg-white">
        <CardHeader className="space-y-3 text-center pb-8">
          <div className="mx-auto flex items-center justify-center">
            {tenant?.logoUrl ? (
              <img
                src={tenant.logoUrl}
                alt={namaLembaga}
                className="h-16 w-auto max-w-[180px] object-contain rounded-lg"
              />
            ) : (
              <div
                className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-xs"
                style={{ backgroundColor: themeColor }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
            )}
          </div>

          <div className="pt-2">
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
              {namaLembaga}
            </CardTitle>
            <CardDescription className="text-slate-500 text-sm mt-1">
              Masukkan Username / No WA / Email dan PIN / Kata Sandi Anda
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-5">
            {errorMsg && (
              <div className="p-3 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg text-center font-medium">
                {errorMsg}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-slate-700 font-medium">
                Username / No WA / Email
              </Label>
              <Input
                id="identifier"
                type="text"
                placeholder="Misal: 08123456789 atau ustadz_123"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="h-12 border-slate-200 rounded-xl outline-none"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin" className="text-slate-700 font-medium">
                PIN / Kata Sandi
              </Label>
              <Input
                id="pin"
                type="password"
                placeholder="Masukkan PIN / Kata Sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 border-slate-200 rounded-xl text-center tracking-widest text-lg"
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col pt-4 pb-6">
            <Button
              type="submit"
              style={{ backgroundColor: themeColor }}
              className="w-full h-12 text-white rounded-xl transition-all font-semibold text-base shadow-xs hover:opacity-90"
              disabled={isLoading}
            >
              {isLoading ? 'Memeriksa...' : 'Masuk Sekarang'}
            </Button>
            <p className="text-xs text-center text-slate-400 mt-4">
              Powered by <span className="font-semibold text-slate-600">TahfidzKu</span>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
