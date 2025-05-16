"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { auth } from "@/lib/firebase/firebase-config"
import { signInWithEmailAndPassword } from "firebase/auth"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"
import { AlertCircle } from "lucide-react"

export default function AdminLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { isFirebaseAvailable } = useFirebaseContext()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    if (!isFirebaseAvailable) return

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsAuthenticated(true)
        router.push("/admin/dashboard")
      } else {
        setIsAuthenticated(false)
      }
    })

    return () => unsubscribe()
  }, [router, isFirebaseAvailable])

  const handleLogin = async (e) => {
    e.preventDefault()

    if (!isFirebaseAvailable) {
      toast({
        title: "Firebase no disponible",
        description: "La autenticación no está disponible porque Firebase no está configurado correctamente.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido al panel de administración",
      })
      router.push("/admin/dashboard")
    } catch (error) {
      console.error("Error logging in:", error)
      toast({
        title: "Error de inicio de sesión",
        description: "Credenciales incorrectas. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (isAuthenticated) {
    return <div className="flex justify-center items-center min-h-screen">Redirigiendo...</div>
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Panel de Administración</CardTitle>
          <CardDescription className="text-center">Cicloturismo Termal de Federación</CardDescription>
        </CardHeader>
        <CardContent>
          {!isFirebaseAvailable && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800">Firebase no configurado</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Para acceder al panel de administración, necesitas configurar las variables de entorno de Firebase.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={!isFirebaseAvailable}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={!isFirebaseAvailable}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 hover:from-pink-600 hover:via-violet-600 hover:to-blue-600"
              disabled={loading || !isFirebaseAvailable}
            >
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </form>

          {!isFirebaseAvailable && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-medium text-blue-800 mb-2">Configuración de Firebase</h3>
              <p className="text-sm text-blue-700 mb-2">
                Para configurar Firebase, necesitas agregar las siguientes variables de entorno a tu proyecto:
              </p>
              <ul className="text-xs text-blue-700 list-disc pl-5 space-y-1">
                <li>NEXT_PUBLIC_FIREBASE_API_KEY</li>
                <li>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</li>
                <li>NEXT_PUBLIC_FIREBASE_PROJECT_ID</li>
                <li>NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET</li>
                <li>NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID</li>
                <li>NEXT_PUBLIC_FIREBASE_APP_ID</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
