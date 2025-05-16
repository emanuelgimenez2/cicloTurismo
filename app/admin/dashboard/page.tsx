"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { db } from "@/lib/firebase/firebase-config"
import { collection, getDocs, query, where } from "firebase/firestore"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Users, Calendar, TrendingUp, ShoppingBag } from "lucide-react"

export default function AdminDashboardPage() {
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
        }))

        setRegistrations(registrationsData)

        // Calculate statistics
        const maleCount = registrationsData.filter((reg) => reg.genero === "masculino").length
        const femaleCount = registrationsData.filter((reg) => reg.genero === "femenino").length
        const otherCount = registrationsData.filter(
          (reg) => reg.genero !== "masculino" && reg.genero !== "femenino",
        ).length
        const withHealthConditions = registrationsData.filter(
          (reg) => reg.condicionSalud && reg.condicionSalud.trim() !== "",
        ).length

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

        setStats({
          totalRegistrations: registrationsData.length,
          maleCount,
          femaleCount,
          otherCount,
          withHealthConditions,
          jerseySize: jerseySizes,
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panel de Administración</h1>
        <p className="text-muted-foreground">
          Bienvenido al panel de administración del Cicloturismo Termal de Federación
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inscripciones</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRegistrations}</div>
            <p className="text-xs text-muted-foreground">de 300 cupos disponibles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Condiciones Médicas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withHealthConditions}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.withHealthConditions / stats.totalRegistrations) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Talle más solicitado</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cupos Disponibles</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{300 - stats.totalRegistrations}</div>
            <p className="text-xs text-muted-foreground">
              {(((300 - stats.totalRegistrations) / 300) * 100).toFixed(1)}% disponible
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="gender" className="space-y-4">
        <TabsList>
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
                  <Tooltip />
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
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
