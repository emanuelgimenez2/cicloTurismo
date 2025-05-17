"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { db } from "@/lib/firebase/firebase-config"
import { collection, getDocs, query, where } from "firebase/firestore"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { Users, Calendar, TrendingUp, ShoppingBag, Loader2 } from "lucide-react"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"

export default function AdminDashboardPage() {
  const { eventSettings } = useFirebaseContext()
  const [registrations, setRegistrations] = useState([])
  const [stats, setStats] = useState({
    totalRegistrations: 0,
    maleCount: 0,
    femaleCount: 0,
    otherCount: 0,
    withHealthConditions: 0,
    jerseySize: {
      xs: 0,
      s: 0,
      m: 0,
      l: 0,
      xl: 0,
      xxl: 0,
    },
    registrationsByDay: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const registrationsRef = collection(db, "registrations")
        const currentYearRegistrations = query(registrationsRef, where("year", "==", new Date().getFullYear()))
        const snapshot = await getDocs(currentYearRegistrations)

        const registrationsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          fechaInscripcion: doc.data().fechaInscripcion?.toDate?.() || new Date(),
        }))

        setRegistrations(registrationsData)

        // Calculate statistics
        const maleCount = registrationsData.filter((reg) => reg.genero === "masculino").length
        const femaleCount = registrationsData.filter((reg) => reg.genero === "femenino").length
        const otherCount = registrationsData.filter(
          (reg) => reg.genero !== "masculino" && reg.genero !== "femenino",
        ).length

        // Count health conditions
        let withHealthConditions = 0
        registrationsData.forEach((reg) => {
          try {
            if (reg.condicionSalud) {
              const condicionSalud =
                typeof reg.condicionSalud === "string" ? JSON.parse(reg.condicionSalud) : reg.condicionSalud

              if (
                condicionSalud.tieneAlergias ||
                condicionSalud.tomaMedicamentos ||
                condicionSalud.tieneProblemasSalud
              ) {
                withHealthConditions++
              }
            }
          } catch (error) {
            console.error("Error parsing condicionSalud:", error)
          }
        })

        // Count jersey sizes
        const jerseySizes = {
          xs: 0,
          s: 0,
          m: 0,
          l: 0,
          xl: 0,
          xxl: 0,
        }

        registrationsData.forEach((reg) => {
          if (reg.talleRemera && jerseySizes.hasOwnProperty(reg.talleRemera.toLowerCase())) {
            jerseySizes[reg.talleRemera.toLowerCase()]++
          }
        })

        // Group registrations by day
        const registrationsByDay = {}
        registrationsData.forEach((reg) => {
          const date = new Date(reg.fechaInscripcion).toLocaleDateString()
          registrationsByDay[date] = (registrationsByDay[date] || 0) + 1
        })

        // Convert to array for chart
        const registrationsByDayArray = Object.entries(registrationsByDay)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(-14) // Last 14 days

        setStats({
          totalRegistrations: registrationsData.length,
          maleCount,
          femaleCount,
          otherCount,
          withHealthConditions,
          jerseySize: jerseySizes,
          registrationsByDay: registrationsByDayArray,
        })
      } catch (error) {
        console.error("Error fetching registrations:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRegistrations()
  }, [])

  const genderData = [
    { name: "Masculino", value: stats.maleCount },
    { name: "Femenino", value: stats.femaleCount },
    { name: "Otro", value: stats.otherCount },
  ]

  const jerseySizeData = Object.entries(stats.jerseySize).map(([size, count]) => ({
    name: size.toUpperCase(),
    value: count,
  }))

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE", "#00C49F"]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-pink-500" />
          <p className="text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panel de Administración</h1>
        <p className="text-muted-foreground">
          Bienvenido al panel de administración del Cicloturismo Termal de Federación
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inscripciones</CardTitle>
            <Users className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRegistrations}</div>
            <p className="text-xs text-muted-foreground">
              de {eventSettings?.cupoMaximo || 300} cupos disponibles (
              {Math.round((stats.totalRegistrations / (eventSettings?.cupoMaximo || 300)) * 100)}%)
            </p>
            <div className="mt-2 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-violet-500 rounded-full"
                style={{
                  width: `${Math.min(100, (stats.totalRegistrations / (eventSettings?.cupoMaximo || 300)) * 100)}%`,
                }}
              ></div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Condiciones Médicas</CardTitle>
            <Calendar className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withHealthConditions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalRegistrations > 0
                ? `${((stats.withHealthConditions / stats.totalRegistrations) * 100).toFixed(1)}% del total`
                : "0% del total"}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Talle más solicitado</CardTitle>
            <ShoppingBag className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.entries(stats.jerseySize)
                .reduce((a, b) => (a[1] > b[1] ? a : b), [null, 0])[0]
                ?.toUpperCase() || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">{Math.max(...Object.values(stats.jerseySize))} remeras</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cupos Disponibles</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(eventSettings?.cupoMaximo || 300) - stats.totalRegistrations}</div>
            <p className="text-xs text-muted-foreground">
              {(
                (((eventSettings?.cupoMaximo || 300) - stats.totalRegistrations) / (eventSettings?.cupoMaximo || 300)) *
                100
              ).toFixed(1)}
              % disponible
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Inscripciones Recientes</CardTitle>
            <CardDescription>Últimos 14 días</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.registrationsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return `${date.getDate()}/${date.getMonth() + 1}`
                  }}
                />
                <YAxis allowDecimals={false} />
                <Tooltip
                  formatter={(value) => [`${value} inscripciones`, "Cantidad"]}
                  labelFormatter={(label) => `Fecha: ${label}`}
                />
                <Bar dataKey="count" name="Inscripciones" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Tabs defaultValue="gender" className="shadow-sm">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="gender">Distribución por Género</TabsTrigger>
            <TabsTrigger value="jerseySize">Talles de Remera</TabsTrigger>
          </TabsList>
          <TabsContent value="gender" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Género</CardTitle>
                <CardDescription>Distribución de participantes según género</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} participantes`, "Cantidad"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="jerseySize" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Talle de Remera</CardTitle>
                <CardDescription>Cantidad de remeras por talle</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={jerseySizeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={(value) => [`${value} remeras`, "Cantidad"]} />
                    <Bar dataKey="value" fill="url(#colorGradient2)" radius={[4, 4, 0, 0]} />
                    <defs>
                      <linearGradient id="colorGradient2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
