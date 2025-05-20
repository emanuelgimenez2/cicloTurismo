"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
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
  AreaChart,
  Area,
  LineChart,
  Line,
} from "recharts"
import {
  Users,
  Calendar,
  TrendingUp,
  Home,
  ArrowUp,
  HeartPulse,
  Shirt,
  MoonIcon as Venus,
  SpaceIcon as Mars,
  Activity,
  BarChart3,
  PieChartIcon,
  Clock,
  CalendarDays,
  Download,
  RefreshCw,
} from "lucide-react"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"

interface Registration {
  id: string
  genero?: string
  talleRemera?: string
  fechaInscripcion: Date
  condicionSalud?: any
  year?: number
  estado?: string
  [key: string]: any
}

interface CondicionSalud {
  tieneAlergias?: boolean
  tomaMedicamentos?: boolean
  tieneProblemasSalud?: boolean
  [key: string]: any
}

interface JerseySize {
  xs: number
  s: number
  m: number
  l: number
  xl: number
  xxl: number
  [key: string]: number
}

interface DashboardStats {
  totalRegistrations: number
  validRegistrations: number
  maleCount: number
  femaleCount: number
  otherCount: number
  withHealthConditions: number
  jerseySize: JerseySize
  registrationsByDay: Array<{ date: string; total: number; rejected: number }>
}

interface ChartDataItem {
  name: string
  value: number
}

// Paleta de colores moderna
const COLORS = {
  primary: "#6366f1",
  secondary: "#8b5cf6",
  accent: "#ec4899",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
  background: "#f9fafb",
  cardBg: "#ffffff",
  textPrimary: "#111827",
  textSecondary: "#4b5563",
}

const GENDER_COLORS = ["#6366f1", "#ec4899", "#3b82f6"]
const JERSEY_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#ef4444"]

const gradientColors = [
  { start: "#6366f1", end: "#8b5cf6" },
  { start: "#ec4899", end: "#f97316" },
  { start: "#10b981", end: "#3b82f6" },
  { start: "#f59e0b", end: "#ef4444" },
]

export default function AdminDashboardPage() {
  const { eventSettings } = useFirebaseContext()
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalRegistrations: 0,
    validRegistrations: 0,
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
  const [timeFilter, setTimeFilter] = useState<string>("all")
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const topRef = useRef<HTMLDivElement>(null)

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchRegistrations()
    setTimeout(() => setRefreshing(false), 1000)
  }

  const fetchRegistrations = async () => {
    try {
      const registrationsRef = collection(db, "participantes2025")
      const currentYearRegistrations = query(registrationsRef, where("year", "==", new Date().getFullYear()))
      const snapshot = await getDocs(currentYearRegistrations)

      const registrationsData: Registration[] = snapshot.docs.map((doc) => {
        const data = doc.data()
        let fechaInscripcion: Date

        if (data.fechaInscripcion && typeof data.fechaInscripcion.toDate === "function") {
          fechaInscripcion = data.fechaInscripcion.toDate()
        } else if (data.fechaInscripcion instanceof Date) {
          fechaInscripcion = data.fechaInscripcion
        } else if (data.fechaInscripcion) {
          fechaInscripcion = new Date(data.fechaInscripcion)
        } else {
          fechaInscripcion = new Date()
        }

        return {
          id: doc.id,
          ...data,
          fechaInscripcion,
        }
      })

      setRegistrations(registrationsData)
      const validRegistrations = registrationsData.filter(
        (reg) => reg.estado === "confirmado" || reg.estado === "pendiente",
      )

      const maleCount = validRegistrations.filter((reg) => reg.genero?.toLowerCase() === "masculino").length
      const femaleCount = validRegistrations.filter((reg) => reg.genero?.toLowerCase() === "femenino").length
      const otherCount = validRegistrations.filter(
        (reg) => reg.genero && reg.genero?.toLowerCase() !== "masculino" && reg.genero?.toLowerCase() !== "femenino",
      ).length

      let withHealthConditions = 0
      validRegistrations.forEach((reg) => {
        try {
          if (reg.condicionSalud) {
            let condicionSalud: string | CondicionSalud = reg.condicionSalud

            if (typeof condicionSalud === "string") {
              try {
                condicionSalud = JSON.parse(condicionSalud) as CondicionSalud
              } catch (e) {
                withHealthConditions++
                return
              }
            }

            if (typeof condicionSalud === "object" && condicionSalud !== null) {
              if (
                condicionSalud.tieneAlergias === true ||
                condicionSalud.tomaMedicamentos === true ||
                condicionSalud.tieneProblemasSalud === true
              ) {
                withHealthConditions++
              }
            } else {
              withHealthConditions++
            }
          }
        } catch (error) {
          console.error("Error al procesar condicionSalud:", error, reg.id)
        }
      })

      const jerseySizes: JerseySize = {
        xs: 0,
        s: 0,
        m: 0,
        l: 0,
        xl: 0,
        xxl: 0,
      }

      validRegistrations.forEach((reg) => {
        if (reg.talleRemera) {
          const size = reg.talleRemera.toLowerCase() as keyof JerseySize
          if (jerseySizes.hasOwnProperty(size)) {
            jerseySizes[size]++
          }
        }
      })

      const registrationsByDay: Record<string, { total: number; rejected: number }> = {}

      const sortedRegistrations = [...registrationsData].sort(
        (a, b) => a.fechaInscripcion.getTime() - b.fechaInscripcion.getTime(),
      )

      if (sortedRegistrations.length > 0) {
        const firstDate = new Date(sortedRegistrations[0].fechaInscripcion)
        const lastDate = new Date(sortedRegistrations[sortedRegistrations.length - 1].fechaInscripcion)

        const currentDate = new Date(firstDate)
        while (currentDate <= lastDate) {
          const dateStr = currentDate.toLocaleDateString()
          registrationsByDay[dateStr] = { total: 0, rejected: 0 }
          currentDate.setDate(currentDate.getDate() + 1)
        }
      }

      registrationsData.forEach((reg) => {
        try {
          if (reg.fechaInscripcion) {
            const date = reg.fechaInscripcion.toLocaleDateString()
            if (!registrationsByDay[date]) {
              registrationsByDay[date] = { total: 0, rejected: 0 }
            }
            registrationsByDay[date].total++
            if (reg.estado === "rechazado") {
              registrationsByDay[date].rejected++
            }
          }
        } catch (error) {
          console.error("Error al procesar fecha:", error)
        }
      })

      const registrationsByDayArray = Object.entries(registrationsByDay)
        .map(([date, counts]) => ({
          date,
          total: counts.total,
          rejected: counts.rejected,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      setStats({
        totalRegistrations: registrationsData.length,
        validRegistrations: validRegistrations.length,
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

  useEffect(() => {
    fetchRegistrations()
  }, [])

  const hasRegistrations = stats.validRegistrations > 0

  const genderData: ChartDataItem[] = [
    { name: "Masculino", value: stats.maleCount },
    { name: "Femenino", value: stats.femaleCount },
    { name: "Otro", value: stats.otherCount },
  ].filter((item) => item.value > 0)

  const jerseySizeData: ChartDataItem[] = Object.entries(stats.jerseySize)
    .map(([size, count]) => ({
      name: size.toUpperCase(),
      value: count,
    }))
    .filter((item) => item.value > 0)

  // Filtrar datos por tiempo seleccionado
  const getFilteredChartData = () => {
    if (timeFilter === "all" || stats.registrationsByDay.length === 0) {
      return stats.registrationsByDay
    }

    const now = new Date()
    const filterDate = new Date()

    switch (timeFilter) {
      case "week":
        filterDate.setDate(now.getDate() - 7)
        break
      case "month":
        filterDate.setMonth(now.getMonth() - 1)
        break
      case "quarter":
        filterDate.setMonth(now.getMonth() - 3)
        break
      default:
        return stats.registrationsByDay
    }

    return stats.registrationsByDay.filter((item) => {
      const itemDate = new Date(item.date)
      return itemDate >= filterDate
    })
  }

  const filteredChartData = getFilteredChartData()

  // Calcular tendencia (porcentaje de cambio)
  const calculateTrend = () => {
    if (filteredChartData.length < 2) return 0

    const firstHalf = filteredChartData.slice(0, Math.floor(filteredChartData.length / 2))
    const secondHalf = filteredChartData.slice(Math.floor(filteredChartData.length / 2))

    const firstHalfTotal = firstHalf.reduce((sum, item) => sum + item.total, 0)
    const secondHalfTotal = secondHalf.reduce((sum, item) => sum + item.total, 0)

    if (firstHalfTotal === 0) return secondHalfTotal > 0 ? 100 : 0

    return ((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100
  }

  const trend = calculateTrend()

  // Calcular porcentaje de ocupación
  const occupancyPercentage = Math.round((stats.validRegistrations / (eventSettings?.cupoMaximo || 300)) * 100)

  // Calcular porcentaje de condiciones médicas
  const healthConditionsPercentage =
    stats.validRegistrations > 0 ? Math.round((stats.withHealthConditions / stats.validRegistrations) * 100) : 0

  // Obtener el talle más solicitado
  const mostRequestedSize =
    Object.entries(stats.jerseySize)
      .reduce((a, b) => (a[1] > b[1] ? a : b), ["", 0])[0]
      ?.toUpperCase() || "N/A"

  // Calcular porcentaje del talle más solicitado
  const mostRequestedSizeCount = Math.max(...Object.values(stats.jerseySize))
  const mostRequestedSizePercentage =
    stats.validRegistrations > 0 ? Math.round((mostRequestedSizeCount / stats.validRegistrations) * 100) : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div ref={topRef} className="flex flex-col items-center justify-center mt-10 mb-8 px-4">
            <h1 className="text-3xl font-bold tracking-tight text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Panel de Administración
            </h1>
            <p className="text-muted-foreground mt-2 text-center">Cargando estadísticas...</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-2 w-full mt-3" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-80 w-full rounded-md" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-80 w-full rounded-md" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          ref={topRef}
          className="flex flex-col items-center justify-center mt-6 mb-8 px-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Panel de Administración
          </h1>
          <p className="text-muted-foreground mt-2 text-center max-w-xl">
            Estadísticas y análisis de inscripciones para el evento {new Date().getFullYear()}
          </p>
        </motion.div>

        {/* Navigation and Actions */}
        <motion.div
          className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 shadow-sm hover:shadow-md transition-all"
              >
                <Home className="h-4 w-4" /> Volver al inicio
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className={`flex items-center gap-2 shadow-sm hover:shadow-md transition-all ${refreshing ? "opacity-70" : ""}`}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Actualizando..." : "Actualizar datos"}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-[180px] bg-white">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <SelectValue placeholder="Periodo" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el periodo</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mes</SelectItem>
                <SelectItem value="quarter">Último trimestre</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 shadow-sm hover:shadow-md transition-all"
            >
              <Download className="h-4 w-4" /> Exportar
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="overflow-hidden border border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300 h-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-indigo-600"></div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm font-medium text-indigo-900">Inscripciones Activas</CardTitle>
                    <CardDescription>Cupo total del evento</CardDescription>
                  </div>
                  <div className="p-2 rounded-full bg-indigo-50">
                    <Users className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-1">
                  <div className="text-3xl font-bold text-indigo-900">{stats.validRegistrations}</div>
                  <span className="text-sm text-indigo-700">/ {eventSettings?.cupoMaximo || 300}</span>
                </div>

                <div className="mt-1 flex items-center gap-2">
                  <Badge
                    variant={trend >= 0 ? "default" : "destructive"}
                    className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
                  >
                    <span className="flex items-center">
                      {trend >= 0 ? "+" : ""}
                      {trend.toFixed(1)}%
                    </span>
                  </Badge>
                  <span className="text-xs text-muted-foreground">vs periodo anterior</span>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Ocupación</span>
                    <span className="font-medium">{occupancyPercentage}%</span>
                  </div>
                  <Progress
                    value={occupancyPercentage}
                    className="h-2"
                    indicatorClassName="bg-gradient-to-r from-indigo-500 to-indigo-600"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="overflow-hidden border border-pink-100 shadow-sm hover:shadow-md transition-all duration-300 h-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-pink-600"></div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm font-medium text-pink-900">Condiciones Médicas</CardTitle>
                    <CardDescription>Participantes con necesidades especiales</CardDescription>
                  </div>
                  <div className="p-2 rounded-full bg-pink-50">
                    <HeartPulse className="h-5 w-5 text-pink-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-1">
                  <div className="text-3xl font-bold text-pink-900">{stats.withHealthConditions}</div>
                  <span className="text-sm text-pink-700">participantes</span>
                </div>

                <div className="mt-1">
                  <Badge variant="outline" className="bg-pink-50 text-pink-800 border-pink-200">
                    {healthConditionsPercentage}% del total
                  </Badge>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Proporción</span>
                    <span className="font-medium">{healthConditionsPercentage}%</span>
                  </div>
                  <Progress
                    value={healthConditionsPercentage}
                    className="h-2"
                    indicatorClassName="bg-gradient-to-r from-pink-500 to-pink-600"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="overflow-hidden border border-purple-100 shadow-sm hover:shadow-md transition-all duration-300 h-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-purple-600"></div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm font-medium text-purple-900">Talle más solicitado</CardTitle>
                    <CardDescription>Distribución de remeras</CardDescription>
                  </div>
                  <div className="p-2 rounded-full bg-purple-50">
                    <Shirt className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-1">
                  <div className="text-3xl font-bold text-purple-900">{mostRequestedSize}</div>
                  <span className="text-sm text-purple-700">talle</span>
                </div>

                <div className="mt-1">
                  <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">
                    {mostRequestedSizeCount} remeras
                  </Badge>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Del total</span>
                    <span className="font-medium">{mostRequestedSizePercentage}%</span>
                  </div>
                  <Progress
                    value={mostRequestedSizePercentage}
                    className="h-2"
                    indicatorClassName="bg-gradient-to-r from-purple-500 to-purple-600"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="overflow-hidden border border-emerald-100 shadow-sm hover:shadow-md transition-all duration-300 h-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-600"></div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm font-medium text-emerald-900">Cupos Disponibles</CardTitle>
                    <CardDescription>Capacidad restante</CardDescription>
                  </div>
                  <div className="p-2 rounded-full bg-emerald-50">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-1">
                  <div className="text-3xl font-bold text-emerald-900">
                    {(eventSettings?.cupoMaximo || 300) - stats.validRegistrations}
                  </div>
                  <span className="text-sm text-emerald-700">cupos</span>
                </div>

                <div className="mt-1">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200">
                    {100 - occupancyPercentage}% disponible
                  </Badge>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Disponibilidad</span>
                    <span className="font-medium">{100 - occupancyPercentage}%</span>
                  </div>
                  <Progress
                    value={100 - occupancyPercentage}
                    className="h-2"
                    indicatorClassName="bg-gradient-to-r from-emerald-500 to-emerald-600"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Charts */}
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="shadow-sm hover:shadow-lg transition-all duration-300 border-0 overflow-hidden bg-white">
              <CardHeader className="border-b bg-gray-50/50 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-indigo-600" />
                    <div>
                      <CardTitle className="text-lg font-semibold">Tendencia de Inscripciones</CardTitle>
                      <CardDescription className="mt-1">Evolución diaria de inscripciones</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 mr-1"></span>
                      Totales
                    </div>
                    <div className="flex items-center text-xs text-pink-600 bg-pink-50 px-2 py-1 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-pink-500 mr-1"></span>
                      Rechazadas
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-80">
                  {hasRegistrations && filteredChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={filteredChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorRejected" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
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
                          contentStyle={{
                            borderRadius: "8px",
                            border: "1px solid #e5e7eb",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                          formatter={(value, name) => [value, name === "total" ? "Inscripciones" : "Rechazadas"]}
                          labelFormatter={(label) => {
                            const date = new Date(label)
                            return date.toLocaleDateString("es-ES", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="total"
                          name="Inscripciones"
                          stroke="#6366f1"
                          fillOpacity={1}
                          fill="url(#colorTotal)"
                          strokeWidth={2}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="rejected"
                          name="Rechazadas"
                          stroke="#ec4899"
                          fillOpacity={1}
                          fill="url(#colorRejected)"
                          strokeWidth={2}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <Calendar className="h-12 w-12 text-gray-300 mb-2" />
                      <p className="text-gray-500 text-center">
                        No hay datos de inscripciones para el periodo seleccionado
                      </p>
                      <Button variant="outline" size="sm" className="mt-4" onClick={() => setTimeFilter("all")}>
                        Ver todos los datos
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t bg-gray-50/50 py-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Actualizado: {new Date().toLocaleTimeString()}
                </div>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Gender and Jersey Size Tabs */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Tabs defaultValue="gender" className="shadow-sm hover:shadow-lg transition-all duration-300">
              <TabsList className="w-full grid grid-cols-2 bg-gray-50 p-1 rounded-t-lg">
                <TabsTrigger
                  value="gender"
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                >
                  <div className="flex items-center">
                    <Venus className="h-4 w-4 mr-1 text-pink-500" />
                    <Mars className="h-4 w-4 text-indigo-500" />
                  </div>
                  Género
                </TabsTrigger>
                <TabsTrigger
                  value="jerseySize"
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                >
                  <Shirt className="h-4 w-4" />
                  Talles
                </TabsTrigger>
              </TabsList>
              <TabsContent value="gender" className="space-y-4 mt-0 border-x border-b rounded-b-lg bg-white">
                <Card className="border-0 shadow-none">
                  <CardHeader className="border-b bg-gray-50/50 pb-3">
                    <div className="flex items-center gap-2">
                      <PieChartIcon className="h-5 w-5 text-indigo-600" />
                      <div>
                        <CardTitle className="text-lg font-semibold">Distribución por Género</CardTitle>
                        <CardDescription>Participantes según género</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="h-80 pt-6">
                    {genderData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <defs>
                            {GENDER_COLORS.map((color, index) => (
                              <linearGradient
                                key={`gender-gradient-${index}`}
                                id={`gender-gradient-${index}`}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                                <stop offset="100%" stopColor={color} stopOpacity={0.5} />
                              </linearGradient>
                            ))}
                          </defs>
                          <Pie
                            data={genderData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                            animationBegin={0}
                            animationDuration={1500}
                          >
                            {genderData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={`url(#gender-gradient-${index})`}
                                stroke={GENDER_COLORS[index % GENDER_COLORS.length]}
                                strokeWidth={1}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [`${value} participantes`, "Cantidad"]}
                            contentStyle={{
                              borderRadius: "8px",
                              border: "1px solid #e5e7eb",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            }}
                          />
                          <Legend
                            layout="horizontal"
                            verticalAlign="bottom"
                            align="center"
                            wrapperStyle={{ paddingTop: "20px" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full">
                        <Venus className="h-8 w-8 text-gray-300 mb-2" />
                        <Mars className="h-8 w-8 text-gray-300 mb-2" />
                        <p className="text-gray-500 text-center">No hay datos de género disponibles</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="border-t bg-gray-50/50 py-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Actualizado: {new Date().toLocaleTimeString()}
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>
              <TabsContent value="jerseySize" className="space-y-4 mt-0 border-x border-b rounded-b-lg bg-white">
                <Card className="border-0 shadow-none">
                  <CardHeader className="border-b bg-gray-50/50 pb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                      <div>
                        <CardTitle className="text-lg font-semibold">Distribución por Talle de Remera</CardTitle>
                        <CardDescription>Cantidad de remeras por talle</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="h-80 pt-6">
                    {jerseySizeData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={jerseySizeData}
                          layout="vertical"
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <defs>
                            {JERSEY_COLORS.map((color, index) => (
                              <linearGradient
                                key={`jersey-gradient-${index}`}
                                id={`jersey-gradient-${index}`}
                                x1="0"
                                y1="0"
                                x2="1"
                                y2="0"
                              >
                                <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                                <stop offset="100%" stopColor={color} stopOpacity={0.5} />
                              </linearGradient>
                            ))}
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={true} vertical={false} />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                          <Tooltip
                            formatter={(value) => [`${value} remeras`, "Cantidad"]}
                            contentStyle={{
                              borderRadius: "8px",
                              border: "1px solid #e5e7eb",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            }}
                          />
                          <Bar
                            dataKey="value"
                            name="Remeras"
                            radius={[0, 4, 4, 0]}
                            animationBegin={0}
                            animationDuration={1500}
                          >
                            {jerseySizeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={`url(#jersey-gradient-${index})`} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full">
                        <Shirt className="h-12 w-12 text-gray-300 mb-2" />
                        <p className="text-gray-500 text-center">No hay datos de talles disponibles</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="border-t bg-gray-50/50 py-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Actualizado: {new Date().toLocaleTimeString()}
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>

        {/* Additional Charts */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mb-6"
        >
          <Card className="shadow-sm hover:shadow-lg transition-all duration-300 border-0 overflow-hidden bg-white">
            <CardHeader className="border-b bg-gray-50/50 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  <div>
                    <CardTitle className="text-lg font-semibold">Análisis de Tendencias</CardTitle>
                    <CardDescription className="mt-1">Comparativa de inscripciones y rechazos</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-80">
                {hasRegistrations && filteredChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTrend1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorTrend2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                          const date = new Date(value)
                          return `${date.getDate()}/${date.getMonth() + 1}`
                        }}
                      />
                      <YAxis allowDecimals={false} yAxisId="left" />
                      <YAxis allowDecimals={false} yAxisId="right" orientation="right" />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                        formatter={(value, name) => [value, name === "total" ? "Inscripciones" : "Rechazadas"]}
                        labelFormatter={(label) => {
                          const date = new Date(label)
                          return date.toLocaleDateString("es-ES", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="total"
                        name="Inscripciones"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 0, fill: "#10b981" }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        yAxisId="left"
                      />
                      <Line
                        type="monotone"
                        dataKey="rejected"
                        name="Rechazadas"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 0, fill: "#f59e0b" }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        yAxisId="right"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Calendar className="h-12 w-12 text-gray-300 mb-2" />
                    <p className="text-gray-500 text-center">
                      No hay datos de inscripciones para el periodo seleccionado
                    </p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => setTimeFilter("all")}>
                      Ver todos los datos
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t bg-gray-50/50 py-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Actualizado: {new Date().toLocaleTimeString()}
              </div>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Scroll to top button */}
        <div className="fixed bottom-8 right-8 z-50">
          <Button
            onClick={scrollToTop}
            variant="default"
            size="icon"
            className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-12 w-12"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
