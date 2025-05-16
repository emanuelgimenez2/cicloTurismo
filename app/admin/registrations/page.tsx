"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/firebase/firebase-config"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { Download, Search, Filter } from "lucide-react"

export default function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState([])
  const [filteredRegistrations, setFilteredRegistrations] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const registrationsRef = collection(db, "registrations")
        const currentYearRegistrations = query(
          registrationsRef,
          where("year", "==", new Date().getFullYear()),
          orderBy("fechaInscripcion", "desc"),
        )
        const snapshot = await getDocs(currentYearRegistrations)

        const registrationsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          fechaInscripcion: doc.data().fechaInscripcion?.toDate?.() || new Date(),
        }))

        setRegistrations(registrationsData)
        setFilteredRegistrations(registrationsData)
      } catch (error) {
        console.error("Error fetching registrations:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRegistrations()
  }, [])

  useEffect(() => {
    // Apply filters
    let filtered = registrations

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (reg) =>
          reg.nombre?.toLowerCase().includes(term) ||
          reg.apellido?.toLowerCase().includes(term) ||
          reg.dni?.includes(term) ||
          reg.email?.toLowerCase().includes(term),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((reg) => reg.estado === statusFilter)
    }

    setFilteredRegistrations(filtered)
  }, [searchTerm, statusFilter, registrations])

  const exportToCSV = () => {
    // Create CSV content
    const headers = [
      "Nombre",
      "Apellido",
      "DNI",
      "Email",
      "Teléfono",
      "Localidad",
      "Género",
      "Talle",
      "Fecha Inscripción",
      "Estado",
    ]
    const csvContent = [
      headers.join(","),
      ...filteredRegistrations.map((reg) =>
        [
          reg.nombre,
          reg.apellido,
          reg.dni,
          reg.email,
          reg.telefono,
          reg.localidad,
          reg.genero,
          reg.talleRemera,
          new Date(reg.fechaInscripcion).toLocaleDateString(),
          reg.estado,
        ].join(","),
      ),
    ].join("\n")

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `inscripciones_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmado":
        return <Badge className="bg-green-500">Confirmado</Badge>
      case "pendiente":
        return <Badge className="bg-yellow-500">Pendiente</Badge>
      case "rechazado":
        return <Badge className="bg-red-500">Rechazado</Badge>
      default:
        return <Badge className="bg-gray-500">Pendiente</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inscripciones</h1>
        <p className="text-muted-foreground">Gestiona las inscripciones al evento</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Inscripciones</CardTitle>
          <CardDescription>Total: {filteredRegistrations.length} inscripciones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, apellido, DNI o email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="rechazado">Rechazado</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p>Cargando inscripciones...</p>
            </div>
          ) : filteredRegistrations.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Apellido</TableHead>
                    <TableHead>DNI</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Talle</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegistrations.map((registration) => (
                    <TableRow key={registration.id}>
                      <TableCell>{registration.nombre}</TableCell>
                      <TableCell>{registration.apellido}</TableCell>
                      <TableCell>{registration.dni}</TableCell>
                      <TableCell>{registration.email}</TableCell>
                      <TableCell>{registration.telefono}</TableCell>
                      <TableCell className="uppercase">{registration.talleRemera}</TableCell>
                      <TableCell>{new Date(registration.fechaInscripcion).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(registration.estado)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Ver detalles
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 border rounded-md">
              <p className="text-muted-foreground">No se encontraron inscripciones</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
