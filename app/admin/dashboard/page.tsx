"use client"

import { useState, useEffect, FC } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { db } from "@/lib/firebase/firebase-config"
import { collection, getDocs, query, where, DocumentData, Timestamp } from "firebase/firestore"
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

interface Registration {
  id: string;
  genero?: string;
  talleRemera?: string;
  fechaInscripcion: Date;
  condicionSalud?: any;
  year?: number;
  [key: string]: any;
}

interface CondicionSalud {
  tieneAlergias?: boolean;
  tomaMedicamentos?: boolean;
  tieneProblemasSalud?: boolean;
  [key: string]: any;
}

interface JerseySize {
  xs: number;
  s: number;
  m: number;
  l: number;
  xl: number;
  xxl: number;
  [key: string]: number;
}

interface DashboardStats {
  totalRegistrations: number;
  maleCount: number;
  femaleCount: number;
  otherCount: number;
  withHealthConditions: number;
  jerseySize: JerseySize;
  registrationsByDay: Array<{date: string, count: number}>;
}

interface ChartDataItem {
  name: string;
  value: number;
}

export default function AdminDashboardPage(): JSX.Element {
  const { eventSettings } = useFirebaseContext()
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [stats, setStats] = useState<DashboardStats>({
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
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        console.log("Fetching registrations from Firestore...")
        const registrationsRef = collection(db, "participantes2025")
        const currentYearRegistrations = query(registrationsRef, where("year", "==", new Date().getFullYear()))
        const snapshot = await getDocs(currentYearRegistrations)

        console.log(`Found ${snapshot.docs.length} registrations`)
        
        const registrationsData: Registration[] = snapshot.docs.map((doc) => {
          const data = doc.data()
          // Verificar si fechaInscripcion es un timestamp de Firestore
          let fechaInscripcion: Date
          if (data.fechaInscripcion && typeof data.fechaInscripcion.toDate === 'function') {
            fechaInscripcion = data.fechaInscripcion.toDate()
          } else if (data.fechaInscripcion instanceof Date) {
            fechaInscripcion = data.fechaInscripcion
          } else if (data.fechaInscripcion) {
            // Intentar convertir a fecha si es una cadena o un timestamp
            fechaInscripcion = new Date(data.fechaInscripcion)
          } else {
            fechaInscripcion = new Date() // Fecha predeterminada
          }
          
          return {
            id: doc.id,
            ...data,
            fechaInscripcion
          }
        })

        console.log("Processed registration data:", registrationsData.length)
        setRegistrations(registrationsData)

        // Calculate statistics
        const maleCount = registrationsData.filter((reg) => 
          reg.genero?.toLowerCase() === "masculino").length
        const femaleCount = registrationsData.filter((reg) => 
          reg.genero?.toLowerCase() === "femenino").length
        const otherCount = registrationsData.filter(
          (reg) => reg.genero && reg.genero?.toLowerCase() !== "masculino" && reg.genero?.toLowerCase() !== "femenino"
        ).length

        // Count health conditions
        let withHealthConditions = 0
        registrationsData.forEach((reg) => {
          try {
            if (reg.condicionSalud) {
              let condicionSalud: string | CondicionSalud = reg.condicionSalud
              
              // Si es string, intentar parsearlo como JSON
              if (typeof condicionSalud === "string") {
                try {
                  condicionSalud = JSON.parse(condicionSalud) as CondicionSalud
                } catch (e) {
                  console.log("No se pudo parsear la condición de salud como JSON", reg.id)
                  // Si no es un JSON válido, considerar cualquier string como condición de salud
                  withHealthConditions++
                  return
                }
              }

              // Verificar si es un objeto y tiene las propiedades esperadas
              if (typeof condicionSalud === "object" && condicionSalud !== null) {
                if (
                  condicionSalud.tieneAlergias === true ||
                  condicionSalud.tomaMedicamentos === true ||
                  condicionSalud.tieneProblemasSalud === true
                ) {
                  withHealthConditions++
                }
              } else {
                // Si existe condicionSalud pero no es un objeto con formato esperado, contarlo
                withHealthConditions++
              }
            }
          } catch (error) {
            console.error("Error al procesar condicionSalud:", error, reg.id)
          }
        })

        // Count jersey sizes
        const jerseySizes: JerseySize = {
          xs: 0,
          s: 0,
          m: 0,
          l: 0,
          xl: 0,
          xxl: 0,
        }

        registrationsData.forEach((reg) => {
          if (reg.talleRemera) {
            const size = reg.talleRemera.toLowerCase() as keyof JerseySize
            if (jerseySizes.hasOwnProperty(size)) {
              jerseySizes[size]++
            }
          }
        })

        // Group registrations by day
        const registrationsByDay: Record<string, number> = {}
        registrationsData.forEach((reg) => {
          try {
            if (reg.fechaInscripcion) {
              const date = reg.fechaInscripcion.toLocaleDateString()
              registrationsByDay[date] = (registrationsByDay[date] || 0) + 1
            }
          } catch (error) {
            console.error("Error al procesar fecha:", error)
          }
        })

        // Convert to array for chart
        const registrationsByDayArray = Object.entries(registrationsByDay)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(-14) // Last 14 days

        console.log("Statistics calculated:", {
          totalRegistrations: registrationsData.length,
          maleCount,
          femaleCount,
          otherCount,
          withHealthConditions,
          jerseySize: jerseySizes,
          registrationsByDay: registrationsByDayArray.length
        })

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

  // Verificar si hay datos antes de crear gráficos
  const hasRegistrations = stats.totalRegistrations > 0
  
  const genderData: ChartDataItem[] = [
    { name: "Masculino", value: stats.maleCount },
    { name: "Femenino", value: stats.femaleCount },
    { name: "Otro", value: stats.otherCount },
  ].filter(item => item.value > 0) // Solo incluir valores positivos

  const jerseySizeData: ChartDataItem[] = Object.entries(stats.jerseySize).map(([size, count]) => ({
    name: size.toUpperCase(),
    value: count,
  })).filter(item => item.value > 0) // Solo incluir valores positivos

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
            {hasRegistrations && stats.registrationsByDay.length > 0 ? (
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
                 
                  <Bar dataKey="count" name="Inscripciones" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No hay datos de inscripciones recientes</p>
              </div>
            )}
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
                {genderData.length > 0 ? (
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
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No hay datos de género disponibles</p>
                  </div>
                )}
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
                {jerseySizeData.length > 0 ? (
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
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No hay datos de talles disponibles</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}