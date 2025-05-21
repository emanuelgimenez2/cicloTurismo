"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { db } from "@/lib/firebase/firebase-config"
import { collection, getDocs, orderBy, query, doc, updateDoc } from "firebase/firestore"
import {
  Search,
  Filter,
  Eye,
  FileText,
  Save,
  X,
  Home,
  ArrowUp,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  RefreshCw,
  CalendarDays,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

// Importa EmailJS
import emailjs from "@emailjs/browser"

// Inicializa EmailJS
if (typeof window !== "undefined") {
  emailjs.init("qZ1uWOlXB-rlAsutR")
}

// Función para formatear fechas
const formatDate = (dateString) => {
  if (!dateString) return null

  // Si ya está en formato día/mes/año, lo dejamos igual
  if (dateString.includes("/")) return dateString

  // Si está en formato ISO (YYYY-MM-DD)
  if (dateString.includes("-")) {
    const [year, month, day] = dateString.split("-")
    return `${day}/${month}/${year}`
  }

  return dateString
}

export default function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState([])
  const [filteredRegistrations, setFilteredRegistrations] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [yearFilter, setYearFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [availableYears, setAvailableYears] = useState([])
  const [selectedRegistration, setSelectedRegistration] = useState(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [statusNote, setStatusNote] = useState("")
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [comprobanteUrl, setComprobanteUrl] = useState("")
  const [loadingComprobante, setLoadingComprobante] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [zoomedImage, setZoomedImage] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [refreshing, setRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const topRef = useRef(null)

  const [sortField, setSortField] = useState("fechaInscripcion")
  const [sortDirection, setSortDirection] = useState("desc")

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
      const allRegistrations = query(registrationsRef, orderBy("fechaInscripcion", "desc"))
      const snapshot = await getDocs(allRegistrations)

      const registrationsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        fechaInscripcion: doc.data().fechaInscripcion?.toDate?.() || new Date(),
        fechaNacimiento: formatDate(doc.data().fechaNacimiento) || "-",
      }))

      const years = [...new Set(registrationsData.map((reg) => reg.fechaInscripcion.getFullYear()))]
      setAvailableYears(years.sort((a, b) => b - a))

      setRegistrations(registrationsData)
      setFilteredRegistrations(registrationsData)
    } catch (error) {
      console.error("Error fetching registrations:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRegistrations()
  }, [])

  useEffect(() => {
    let filtered = registrations

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (reg) =>
          reg.nombre?.toLowerCase().includes(term) ||
          reg.apellido?.toLowerCase().includes(term) ||
          reg.dni?.includes(term) ||
          reg.email?.toLowerCase().includes(term) ||
          reg.telefono?.includes(term) ||
          reg.localidad?.toLowerCase().includes(term),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((reg) => reg.estado === statusFilter)
    }

    if (yearFilter !== "all") {
      filtered = filtered.filter((reg) => reg.fechaInscripcion.getFullYear() === Number.parseInt(yearFilter))
    }

    setFilteredRegistrations(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [searchTerm, statusFilter, yearFilter, registrations])

  // Ordenar los registros filtrados
  useEffect(() => {
    setFilteredRegistrations((prev) => {
      const sorted = [...prev].sort((a, b) => {
        let aValue = a[sortField]
        let bValue = b[sortField]

        // Manejar valores nulos o undefined
        if (aValue === undefined || aValue === null) aValue = ""
        if (bValue === undefined || bValue === null) bValue = ""

        // Convertir a string para comparación si no son fechas
        if (typeof aValue !== "object" && typeof bValue !== "object") {
          aValue = String(aValue).toLowerCase()
          bValue = String(bValue).toLowerCase()
        }

        // Ordenar fechas
        if (sortField === "fechaInscripcion") {
          return sortDirection === "asc" ? new Date(aValue) - new Date(bValue) : new Date(bValue) - new Date(aValue)
        }

        // Ordenamiento normal
        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
        return 0
      })

      return sorted
    })
  }, [sortField, sortDirection, filteredRegistrations.length])

  const loadComprobante = async (registration) => {
    setLoadingComprobante(true)
    try {
      let url = ""

      if (registration.comprobantePagoUrl) {
        url = registration.comprobantePagoUrl
      } else if (registration.imagenBase64) {
        url = registration.imagenBase64
      }

      setComprobanteUrl(url)
      return url
    } catch (error) {
      console.error("Error cargando comprobante:", error)
      setComprobanteUrl("")
      return ""
    } finally {
      setLoadingComprobante(false)
    }
  }

  const handleMouseDown = (e) => {
    if (zoomedImage) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - zoomPosition.x,
        y: e.clientY - zoomPosition.y,
      })
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging && zoomedImage) {
      setZoomPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const openDetailsModal = async (registration) => {
    setSelectedRegistration(registration)
    setNewStatus(registration.estado || "pendiente")
    setStatusNote(registration.nota || "")
    setIsDetailsModalOpen(true)
    await loadComprobante(registration)
  }

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false)
    setSelectedRegistration(null)
    setNewStatus("")
    setStatusNote("")
    setComprobanteUrl("")
  }

  const openImageModal = () => {
    setIsImageModalOpen(true)
  }

  const closeImageModal = () => {
    setIsImageModalOpen(false)
  }

  const sendConfirmationEmail = async (participant) => {
    if (!participant || !participant.email) {
      console.error("No se puede enviar email: información del participante incompleta")
      return false
    }

    setSendingEmail(true)
    try {
      const templateParams = {
        nombre: participant.nombre || "",
        apellido: participant.apellido || "",
        dni: participant.dni || "",
        email: participant.email,
        telefono: participant.telefono || "",
        localidad: participant.localidad || "",
        genero: participant.genero || "",
        talleRemera: participant.talleRemera || "",
        fechaInscripcion: participant.fechaInscripcion.toLocaleDateString("es-ES"),
      }

      const response = await emailjs.send("default_service", "template_2fg4bhx", templateParams)

      console.log("Email enviado con éxito:", response)
      return true
    } catch (error) {
      console.error("Error al enviar el correo de confirmación:", error)
      return false
    } finally {
      setSendingEmail(false)
    }
  }

  const updateRegistrationStatus = async () => {
    if (!selectedRegistration) return

    setUpdatingStatus(true)
    try {
      const registrationRef = doc(db, "participantes2025", selectedRegistration.id)
      const updateData = {
        estado: newStatus,
        nota: statusNote,
        fechaActualizacion: new Date(),
      }

      await updateDoc(registrationRef, updateData)

      if (newStatus === "confirmado" && selectedRegistration.estado !== "confirmado") {
        const emailSent = await sendConfirmationEmail(selectedRegistration)
        if (emailSent) {
          await updateDoc(registrationRef, {
            emailEnviado: true,
            fechaEmailEnviado: new Date(),
          })
        }
      }

      setRegistrations((prev) =>
        prev.map((reg) =>
          reg.id === selectedRegistration.id
            ? {
                ...reg,
                ...updateData,
                fechaActualizacion: new Date(),
                emailEnviado: newStatus === "confirmado" ? true : reg.emailEnviado,
              }
            : reg,
        ),
      )

      alert(
        "Estado actualizado correctamente" +
          (newStatus === "confirmado" && selectedRegistration.estado !== "confirmado"
            ? " y correo de confirmación enviado"
            : ""),
      )
      closeDetailsModal()
    } catch (error) {
      console.error("Error updating registration:", error)
      alert("Error al actualizar el estado")
    } finally {
      setUpdatingStatus(false)
    }
  }

  const exportApprovedToPDF = () => {
    const approvedRegistrations = registrations
      .filter((reg) => reg.estado === "confirmado")
      .sort((a, b) => a.apellido?.localeCompare(b.apellido) || 0)

    // Calcular totales por grupo de bici
    const gruposBici = {}
    approvedRegistrations.forEach((reg) => {
      const grupoBici =
        reg.grupoCiclistas || reg.grupoBici || reg.grupo_bici || reg.grupobici || reg.grupo || "Sin especificar"
      gruposBici[grupoBici] = (gruposBici[grupoBici] || 0) + 1
    })

    // Preparar resumen de grupos
    const resumenGruposBici = Object.entries(gruposBici)
      .map(([grupo, cantidad]) => `${grupo}: ${cantidad}`)
      .join("<br>")

    const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Lista de Participantes Confirmados</title>
    <style>
      body { 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        margin: 20px; 
        font-size: 12px;
        color: #333;
        background-color: #f9fafb;
      }
      h1, h2, h3 { 
        color: #4f46e5; 
        text-align: center; 
        margin-bottom: 0.5em;
      }
      .header { 
        text-align: center; 
        margin-bottom: 20px; 
        padding: 20px;
        background: linear-gradient(to right, #6366f1, #8b5cf6);
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      }
      .header h2 {
        color: white;
        font-size: 24px;
        margin: 0;
      }
      .header p {
        margin: 5px 0 0;
        opacity: 0.9;
      }
      .summary { 
        margin-bottom: 20px; 
        border: 1px solid #e5e7eb; 
        padding: 15px; 
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
      }
      .summary h3 {
        color: #4f46e5;
        text-align: left;
        margin-top: 0;
        font-size: 16px;
      }
      .summary p {
        margin: 8px 0;
      }
      .summary strong {
        color: #4f46e5;
      }
      table { 
        width: 100%; 
        border-collapse: collapse; 
        margin-top: 10px; 
        font-size: 11px;
        background-color: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
      }
      th, td { 
        border: 1px solid #e5e7eb; 
        padding: 8px; 
        text-align: left; 
      }
      th { 
        background-color: #f3f4f6; 
        font-weight: bold;
        color: #4b5563;
      }
      th:first-child, td:first-child {
        text-align: center;
        width: 40px;
      }
      tr:nth-child(even) { 
        background-color: #f9fafb; 
      }
      tr:hover {
        background-color: #eff6ff;
      }
      .footer {
        text-align: center;
        margin-top: 20px;
        font-size: 10px;
        color: #6b7280;
      }
      @media print {
        body { background-color: white; }
        .no-break { page-break-inside: avoid; }
        thead { display: table-header-group; }
        tfoot { display: table-footer-group; }
        .header, .summary, table {
          box-shadow: none;
        }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h2>Lista de Participantes</h2>
      <p>Fecha de generación: ${new Date().toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}</p>
    </div>
    
    <div class="summary">
      <h3>Resumen</h3>
      <p>Total de participantes confirmados: <strong>${approvedRegistrations.length}</strong></p>
      ${
        Object.keys(gruposBici).length > 0
          ? `<p>Distribución por grupo de ciclistas:</p>
             <ul>${Object.entries(gruposBici)
               .map(
                 ([grupo, cantidad]) =>
                   `<li><strong>${grupo}</strong>: ${cantidad} participante${cantidad !== 1 ? "s" : ""}</li>`,
               )
               .join("")}</ul>`
          : "<p>No hay información de grupos de ciclistas disponible</p>"
      }
    </div>
    
    <table>
      <thead>
        <tr>
          <th>N°</th>
          <th>Apellido y Nombre</th>
          <th>DNI</th>
          <th>Teléfono</th>
          <th>Tel. Emergencia</th>
          <th>Grupo Sanguíneo</th>
          <th>Grupo Bici</th>
          <th>Localidad</th>
          <th>Talle</th>
          <th>Condiciones de Salud</th>
        </tr>
      </thead>
      <tbody>
        ${approvedRegistrations
          .map((reg, index) => {
            const grupoBici = reg.grupoCiclistas || reg.grupoBici || reg.grupo_bici || reg.grupobici || reg.grupo || ""

            // Manejar el campo condicionSalud
            let condicionesDeSalud = ""

            if (reg.condicionSalud) {
              if (typeof reg.condicionSalud === "string" && reg.condicionSalud.trim().startsWith("{")) {
                try {
                  const parsed = JSON.parse(reg.condicionSalud)
                  condicionesDeSalud = parsed.condicionSalud || parsed.condicionesSalud || ""
                } catch (e) {
                  condicionesDeSalud = reg.condicionSalud
                }
              } else if (typeof reg.condicionSalud === "object") {
                condicionesDeSalud = reg.condicionSalud.condicionSalud || reg.condicionSalud.condicionesSalud || ""
              } else {
                condicionesDeSalud = reg.condicionSalud
              }
            }

            const telefonoEmergencia =
              reg.telefonoEmergencia || reg.telefono_emergencia || reg.telEmergencia || reg.telefonoContacto || ""
            const grupoSanguineo = reg.grupoSanguineo || reg.grupo_sanguineo || reg.gruposanguineo || reg.sangre || ""

            return `
          <tr>
            <td>${index + 1}</td>
            <td><strong>${reg.apellido || ""}, ${reg.nombre || ""}</strong></td>
            <td>${reg.dni || ""}</td>
            <td>${reg.telefono || ""}</td>
            <td>${telefonoEmergencia}</td>
            <td>${grupoSanguineo}</td>
            <td>${grupoBici}</td>
            <td>${reg.localidad || ""}</td>
            <td style="text-transform: uppercase;">${reg.talleRemera || ""}</td>
            <td>${condicionesDeSalud}</td>
          </tr>
        `
          })
          .join("")}
      </tbody>
    </table>
    
    <div class="footer">
      <p>Este documento es confidencial y contiene información personal de los participantes.</p>
      <p>Generado automáticamente desde el sistema de administración de inscripciones.</p>
    </div>
  </body>
  </html>
  `

    // Crear y descargar el archivo HTML (que puede ser convertido a PDF)
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `participantes_confirmados_${new Date().toISOString().split("T")[0]}.html`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const exportToExcel = () => {
    const approvedRegistrations = registrations
      .filter((reg) => reg.estado === "confirmado")
      .sort((a, b) => a.apellido?.localeCompare(b.apellido) || 0)

    // Crear un array con los encabezados
    const headers = [
      "N°",
      "Apellido",
      "Nombre",
      "DNI",
      "Email",
      "Teléfono",
      "Tel. Emergencia",
      "Localidad",
      "Fecha Nacimiento",
      "Género",
      "Grupo Sanguíneo",
      "Talle Remera",
      "Grupo Ciclistas",
      "Condiciones de Salud",
    ]

    // Crear filas de datos
    const rows = approvedRegistrations.map((reg, index) => {
      // Procesar condiciones de salud
      let condicionesDeSalud = ""
      if (reg.condicionSalud) {
        if (typeof reg.condicionSalud === "string" && reg.condicionSalud.trim().startsWith("{")) {
          try {
            const parsed = JSON.parse(reg.condicionSalud)
            condicionesDeSalud = parsed.condicionSalud || parsed.condicionesSalud || ""
          } catch (e) {
            condicionesDeSalud = reg.condicionSalud
          }
        } else if (typeof reg.condicionSalud === "object") {
          condicionesDeSalud = reg.condicionSalud.condicionSalud || reg.condicionSalud.condicionesSalud || ""
        } else {
          condicionesDeSalud = reg.condicionSalud
        }
      }

      const telefonoEmergencia =
        reg.telefonoEmergencia || reg.telefono_emergencia || reg.telEmergencia || reg.telefonoContacto || ""
      const grupoSanguineo = reg.grupoSanguineo || reg.grupo_sanguineo || reg.gruposanguineo || reg.sangre || ""
      const grupoBici = reg.grupoCiclistas || reg.grupoBici || reg.grupo_bici || reg.grupobici || reg.grupo || ""

      return [
        index + 1,
        reg.apellido || "",
        reg.nombre || "",
        reg.dni || "",
        reg.email || "",
        reg.telefono || "",
        telefonoEmergencia,
        reg.localidad || "",
        reg.fechaNacimiento || "",
        reg.genero || "",
        grupoSanguineo,
        reg.talleRemera || "",
        grupoBici,
        condicionesDeSalud,
      ]
    })

    // Crear el contenido CSV
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => {
            // Escapar comas y comillas en los valores
            const cellStr = String(cell || "")
            if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
              return `"${cellStr.replace(/"/g, '""')}"`
            }
            return cellStr
          })
          .join(","),
      ),
    ].join("\n")

    // Crear y descargar el archivo CSV
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `participantes_confirmados_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmado":
        return (
          <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmado
          </Badge>
        )
      case "pendiente":
        return (
          <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0">
            <Clock className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        )
      case "rechazado":
        return (
          <Badge className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white border-0">
            <XCircle className="h-3 w-3 mr-1" />
            Rechazado
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white border-0">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        )
    }
  }

  const getStatistics = () => {
    const total = registrations.length
    const confirmados = registrations.filter((reg) => reg.estado === "confirmado").length
    const pendientes = registrations.filter((reg) => reg.estado === "pendiente" || !reg.estado).length
    const rechazados = registrations.filter((reg) => reg.estado === "rechazado").length

    return { total, confirmados, pendientes, rechazados }
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const stats = getStatistics()
  const filteredStats = getStatistics()

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredRegistrations.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage)

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div ref={topRef} className="flex flex-col items-center justify-center mt-10 mb-8 px-4">
            <h1 className="text-3xl font-bold tracking-tight text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Administración de Inscripciones
            </h1>
            <p className="text-muted-foreground mt-2 text-center">Cargando datos...</p>
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
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <Skeleton className="h-10 w-full md:w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-40" />
                </div>
              </div>
              <Skeleton className="h-[400px] w-full rounded-md" />
            </CardContent>
          </Card>
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
            Inscripciones
          </h1>
          <p className="text-muted-foreground mt-2 text-center max-w-xl">
            Gestión de participantes {new Date().getFullYear()}
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
              className={`flex items-center gap-2 shadow-sm hover:shadow-md transition-all ${
                refreshing ? "opacity-70" : ""
              }`}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Actualizando..." : "Actualizar datos"}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[180px] bg-white">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <SelectValue placeholder="Año" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los años</SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 shadow-sm hover:shadow-md transition-all"
              onClick={exportApprovedToPDF}
              disabled={registrations.filter((r) => r.estado === "confirmado").length === 0}
            >
              <FileText className="h-4 w-4" /> Exportar PDF
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
                    <CardTitle className="text-sm font-medium text-indigo-900">Total Inscripciones</CardTitle>
                    <CardDescription>Todas las inscripciones</CardDescription>
                  </div>
                  <div className="p-2 rounded-full bg-indigo-50">
                    <Users className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-1">
                  <div className="text-3xl font-bold text-indigo-900">{stats.total}</div>
                  <span className="text-sm text-indigo-700">inscripciones</span>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Filtrados</span>
                    <span className="font-medium">
                      {filteredRegistrations.length} ({Math.round((filteredRegistrations.length / stats.total) * 100)}%)
                    </span>
                  </div>
                  <Progress
                    value={(filteredRegistrations.length / stats.total) * 100}
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
            <Card className="overflow-hidden border border-emerald-100 shadow-sm hover:shadow-md transition-all duration-300 h-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-600"></div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm font-medium text-emerald-900">Confirmados</CardTitle>
                    <CardDescription>Inscripciones aprobadas</CardDescription>
                  </div>
                  <div className="p-2 rounded-full bg-emerald-50">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-1">
                  <div className="text-3xl font-bold text-emerald-900">{stats.confirmados}</div>
                  <span className="text-sm text-emerald-700">participantes</span>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Del total</span>
                    <span className="font-medium">{Math.round((stats.confirmados / stats.total) * 100)}%</span>
                  </div>
                  <Progress
                    value={(stats.confirmados / stats.total) * 100}
                    className="h-2"
                    indicatorClassName="bg-gradient-to-r from-emerald-500 to-emerald-600"
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
            <Card className="overflow-hidden border border-amber-100 shadow-sm hover:shadow-md transition-all duration-300 h-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-amber-600"></div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm font-medium text-amber-900">Pendientes</CardTitle>
                    <CardDescription>Inscripciones en revisión</CardDescription>
                  </div>
                  <div className="p-2 rounded-full bg-amber-50">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-1">
                  <div className="text-3xl font-bold text-amber-900">{stats.pendientes}</div>
                  <span className="text-sm text-amber-700">por revisar</span>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Del total</span>
                    <span className="font-medium">{Math.round((stats.pendientes / stats.total) * 100)}%</span>
                  </div>
                  <Progress
                    value={(stats.pendientes / stats.total) * 100}
                    className="h-2"
                    indicatorClassName="bg-gradient-to-r from-amber-500 to-amber-600"
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
            <Card className="overflow-hidden border border-rose-100 shadow-sm hover:shadow-md transition-all duration-300 h-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-rose-600"></div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm font-medium text-rose-900">Rechazados</CardTitle>
                    <CardDescription>Inscripciones no aprobadas</CardDescription>
                  </div>
                  <div className="p-2 rounded-full bg-rose-50">
                    <XCircle className="h-5 w-5 text-rose-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-1">
                  <div className="text-3xl font-bold text-rose-900">{stats.rechazados}</div>
                  <span className="text-sm text-rose-700">rechazados</span>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Del total</span>
                    <span className="font-medium">{Math.round((stats.rechazados / stats.total) * 100)}%</span>
                  </div>
                  <Progress
                    value={(stats.rechazados / stats.total) * 100}
                    className="h-2"
                    indicatorClassName="bg-gradient-to-r from-rose-500 to-rose-600"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-0 overflow-hidden bg-white">
            <CardHeader className="border-b bg-gray-50/50 pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-600" />
                    Lista de Inscripciones
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredRegistrations.length)} de{" "}
                    {filteredRegistrations.length} inscripciones
                    {filteredRegistrations.length !== registrations.length
                      ? ` (filtrado de ${registrations.length} total)`
                      : ""}
                  </CardDescription>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre, apellido, DNI, email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 bg-white"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-40 bg-white">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <SelectValue placeholder="Estado" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="confirmado">Confirmado</SelectItem>
                      <SelectItem value="rechazado">Rechazado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredRegistrations.length > 0 ? (
                <div className="rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80 hover:bg-gray-50">
                        <TableHead className="font-semibold w-14 text-center">
                          <div className="flex items-center justify-center">#</div>
                        </TableHead>
                        <TableHead
                          className="font-semibold cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort("nombre")}
                        >
                          <div className="flex items-center">
                            Nombre
                            {sortField === "nombre" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead
                          className="font-semibold cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort("apellido")}
                        >
                          <div className="flex items-center">
                            Apellido
                            {sortField === "apellido" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead
                          className="font-semibold cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort("dni")}
                        >
                          <div className="flex items-center">
                            DNI
                            {sortField === "dni" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                          </div>
                        </TableHead>
                        <TableHead
                          className="font-semibold hidden md:table-cell cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort("email")}
                        >
                          <div className="flex items-center">
                            Email
                            {sortField === "email" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead
                          className="font-semibold hidden md:table-cell cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort("telefono")}
                        >
                          <div className="flex items-center">
                            Teléfono
                            {sortField === "telefono" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead
                          className="font-semibold hidden lg:table-cell cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort("localidad")}
                        >
                          <div className="flex items-center">
                            Localidad
                            {sortField === "localidad" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead
                          className="font-semibold hidden lg:table-cell cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort("talleRemera")}
                        >
                          <div className="flex items-center">
                            Talle
                            {sortField === "talleRemera" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead
                          className="font-semibold hidden lg:table-cell cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort("fechaNacimiento")}
                        >
                          <div className="flex items-center">
                            Fecha Nac.
                            {sortField === "fechaNacimiento" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead
                          className="font-semibold cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort("estado")}
                        >
                          <div className="flex items-center">
                            Estado
                            {sortField === "estado" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="text-right font-semibold">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentItems.map((registration, index) => (
                        <TableRow key={registration.id} className="hover:bg-gray-50/80 transition-colors border-b">
                          <TableCell className="font-medium text-center text-gray-500">
                            {indexOfFirstItem + index + 1}
                          </TableCell>
                          <TableCell className="font-medium">{registration.nombre || "-"}</TableCell>
                          <TableCell>{registration.apellido || "-"}</TableCell>
                          <TableCell>{registration.dni || "-"}</TableCell>
                          <TableCell className="max-w-xs truncate hidden md:table-cell">
                            {registration.email || "-"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{registration.telefono || "-"}</TableCell>
                          <TableCell className="hidden lg:table-cell">{registration.localidad || "-"}</TableCell>
                          <TableCell className="uppercase hidden lg:table-cell">
                            {registration.talleRemera || "-"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">{registration.fechaNacimiento || "-"}</TableCell>
                          <TableCell>{getStatusBadge(registration.estado)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDetailsModal(registration)}
                              className="hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <Users className="h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-muted-foreground text-center mb-2">
                    {searchTerm || statusFilter !== "all" || yearFilter !== "all"
                      ? "No se encontraron inscripciones con los filtros aplicados"
                      : "No hay inscripciones registradas"}
                  </p>
                  {(searchTerm || statusFilter !== "all" || yearFilter !== "all") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("")
                        setStatusFilter("all")
                        setYearFilter("all")
                      }}
                      className="mt-2"
                    >
                      Limpiar filtros
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
            {filteredRegistrations.length > itemsPerPage && (
              <CardFooter className="border-t bg-gray-50/50 py-4 flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Show pages around current page
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <Button
                        key={i}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => paginate(pageNum)}
                        className={`h-8 w-8 p-0 ${
                          currentPage === pageNum
                            ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                            : "hover:bg-indigo-50 hover:text-indigo-600"
                        }`}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value))
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-[130px] h-8">
                    <SelectValue placeholder="Filas por página" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 por página</SelectItem>
                    <SelectItem value="25">25 por página</SelectItem>
                    <SelectItem value="50">50 por página</SelectItem>
                    <SelectItem value="100">100 por página</SelectItem>
                  </SelectContent>
                </Select>
              </CardFooter>
            )}
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

        {/* Details Modal */}
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                Detalles de Inscripción
              </DialogTitle>
              <DialogDescription>Información completa del participante</DialogDescription>
            </DialogHeader>

            {selectedRegistration && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-2 bg-gray-50/50">
                      <CardTitle className="text-sm font-medium text-gray-700">Información Personal</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Nombre completo</Label>
                        <p className="text-sm font-medium">
                          {selectedRegistration.nombre} {selectedRegistration.apellido}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500">DNI</Label>
                        <p className="text-sm">{selectedRegistration.dni || "-"}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Fecha de Nacimiento</Label>
                        <p className="text-sm">{selectedRegistration.fechaNacimiento || "-"}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Género</Label>
                        <p className="text-sm">{selectedRegistration.genero || "-"}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-2 bg-gray-50/50">
                      <CardTitle className="text-sm font-medium text-gray-700">Contacto</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Email</Label>
                        <p className="text-sm break-words">{selectedRegistration.email || "-"}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Teléfono</Label>
                        <p className="text-sm">{selectedRegistration.telefono || "-"}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Teléfono de Emergencia</Label>
                        <p className="text-sm">{selectedRegistration.telefonoEmergencia || "-"}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Localidad</Label>
                        <p className="text-sm">{selectedRegistration.localidad || "-"}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-2 bg-gray-50/50">
                      <CardTitle className="text-sm font-medium text-gray-700">Información Médica</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Grupo Sanguíneo</Label>
                        <p className="text-sm">{selectedRegistration.grupoSanguineo || "-"}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Condiciones de Salud</Label>
                        <p className="text-sm break-words">
                          {(() => {
                            // Primero intentamos con condicionesSalud
                            if (selectedRegistration.condicionesSalud) {
                              return selectedRegistration.condicionesSalud
                            }

                            // Si no existe, procesamos condicionSalud
                            if (selectedRegistration.condicionSalud) {
                              // Si es string que parece JSON
                              if (
                                typeof selectedRegistration.condicionSalud === "string" &&
                                selectedRegistration.condicionSalud.trim().startsWith("{")
                              ) {
                                try {
                                  const parsed = JSON.parse(selectedRegistration.condicionSalud)
                                  return parsed.condicionesSalud || parsed.condicionSalud || "-"
                                } catch (e) {
                                  return selectedRegistration.condicionSalud
                                }
                              }
                              // Si es objeto
                              else if (typeof selectedRegistration.condicionSalud === "object") {
                                return (
                                  selectedRegistration.condicionesSalud ||
                                  selectedRegistration.condicionSalud.condicionSalud ||
                                  JSON.stringify(selectedRegistration.condicionSalud)
                                )
                              }
                              // Si es string normal
                              return selectedRegistration.condicionSalud
                            }

                            return "-"
                          })()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-2 bg-gray-50/50">
                      <CardTitle className="text-sm font-medium text-gray-700">Detalles del Evento</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Fecha de Inscripción</Label>
                        <p className="text-sm">
                          {selectedRegistration.fechaInscripcion?.toLocaleDateString("es-ES") || "-"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Talle de Remera</Label>
                        <p className="text-sm uppercase font-medium">{selectedRegistration.talleRemera || "-"}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Grupo de Ciclistas</Label>
                        <p className="text-sm">{selectedRegistration.grupoCiclistas || "-"}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Estado Actual</Label>
                        <div className="mt-1">{getStatusBadge(selectedRegistration.estado)}</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-2 bg-gray-50/50">
                      <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Comprobante de Pago
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {loadingComprobante ? (
                        <div className="flex items-center justify-center h-40 border rounded-md bg-gray-50">
                          <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
                          <p className="ml-2 text-sm text-gray-500">Cargando comprobante...</p>
                        </div>
                      ) : comprobanteUrl ? (
                        <div className="border rounded-md p-2 bg-gray-50">
                          {selectedRegistration.comprobantePagoUrl?.endsWith(".pdf") ||
                          selectedRegistration.nombreArchivo?.endsWith(".pdf") ? (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center justify-center h-40 border rounded-md bg-white">
                                <iframe
                                  src={comprobanteUrl}
                                  className="w-full h-full border-none"
                                  title="Comprobante de pago"
                                />
                              </div>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setIsDetailsModalOpen(false)
                                  setIsImageModalOpen(true)
                                }}
                                className="w-full"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Ver PDF completo
                              </Button>
                            </div>
                          ) : (
                            <div
                              className="cursor-pointer border rounded-md p-2 bg-white"
                              onClick={() => {
                                setIsDetailsModalOpen(false)
                                setIsImageModalOpen(true)
                              }}
                            >
                              <img
                                src={comprobanteUrl || "/placeholder.svg"}
                                alt="Comprobante de pago"
                                className="max-h-60 mx-auto object-contain"
                              />
                              <div className="text-center mt-2">
                                <Button variant="outline" size="sm" className="text-xs">
                                  <ZoomIn className="h-3 w-3 mr-1" />
                                  Ampliar imagen
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-40 border rounded-md bg-gray-50">
                          <FileText className="h-8 w-8 text-gray-300 mb-2" />
                          <p className="text-gray-500 text-sm">No hay comprobante disponible</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-2 bg-gray-50/50">
                      <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Nota (opcional)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <Textarea
                        id="note"
                        placeholder="Agregar una nota sobre esta inscripción..."
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        rows={8}
                        className="resize-none"
                      />
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-2 bg-gray-50/50">
                      <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Estado de la Inscripción
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="status" className="text-sm">
                            Seleccionar estado
                          </Label>
                          <Select value={newStatus} onValueChange={setNewStatus}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Seleccionar estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendiente">
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-2 text-amber-500" />
                                  Pendiente
                                </div>
                              </SelectItem>
                              <SelectItem value="confirmado">
                                <div className="flex items-center">
                                  <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
                                  Confirmado
                                </div>
                              </SelectItem>
                              <SelectItem value="rechazado">
                                <div className="flex items-center">
                                  <XCircle className="h-4 w-4 mr-2 text-rose-500" />
                                  Rechazado
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="pt-2">
                          <p className="text-xs text-gray-500 mb-2">
                            {newStatus === "confirmado" && selectedRegistration.estado !== "confirmado"
                              ? "Al confirmar, se enviará un email automático al participante."
                              : newStatus === "rechazado"
                                ? "Al rechazar, el participante no podrá asistir al evento."
                                : "El estado pendiente requiere revisión posterior."}
                          </p>

                          <Button
                            onClick={updateRegistrationStatus}
                            disabled={updatingStatus || sendingEmail}
                            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800"
                          >
                            {updatingStatus || sendingEmail ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {updatingStatus ? "Guardando..." : "Enviando email..."}
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Guardar cambios
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={closeDetailsModal}>
                <X className="mr-2 h-4 w-4" />
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Image Modal */}
        <Dialog
          open={isImageModalOpen}
          onOpenChange={(open) => {
            if (!open) {
              setZoomedImage(false)
              setZoomPosition({ x: 0, y: 0 })
            }
            setIsImageModalOpen(open)
          }}
        >
          <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden">
            <DialogHeader className="p-4 bg-gray-50 border-b">
              <DialogTitle className="text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                Comprobante de Pago
              </DialogTitle>
            </DialogHeader>
            <div className="flex justify-center items-center h-full overflow-hidden bg-gray-100 p-4">
              {selectedRegistration?.comprobantePagoUrl?.endsWith(".pdf") ||
              selectedRegistration?.nombreArchivo?.endsWith(".pdf") ? (
                <iframe
                  src={comprobanteUrl}
                  className="w-full h-[80vh] border-none bg-white rounded-md shadow-sm"
                  title="Comprobante de pago ampliado"
                />
              ) : (
                <div
                  className="relative w-full h-full flex justify-center items-center"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <div
                    className="w-full h-full flex justify-center items-center overflow-hidden bg-white rounded-md shadow-sm p-4"
                    onClick={() => !isDragging && setZoomedImage(!zoomedImage)}
                  >
                    <img
                      src={comprobanteUrl || "/placeholder.svg"}
                      alt="Comprobante de pago ampliado"
                      className={`${zoomedImage ? "cursor-move" : "cursor-zoom-in"} transition-transform duration-300`}
                      style={{
                        transform: zoomedImage
                          ? `scale(1.5) translate(${zoomPosition.x}px, ${zoomPosition.y}px)`
                          : "scale(1)",
                        maxWidth: zoomedImage ? "none" : "100%",
                        maxHeight: zoomedImage ? "none" : "90vh",
                        objectFit: "contain",
                      }}
                    />
                  </div>
                  {zoomedImage && (
                    <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-md text-sm">
                      {isDragging ? "Suelta para dejar de mover" : "Arrastra para mover la imagen"}
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setZoomedImage(!zoomedImage)}
                      className="bg-white bg-opacity-80 hover:bg-opacity-100"
                    >
                      {zoomedImage ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setZoomPosition({ x: 0, y: 0 })
                      }}
                      className="bg-white bg-opacity-80 hover:bg-opacity-100"
                      disabled={!zoomedImage}
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="p-4 bg-gray-50 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setZoomedImage(false)
                  setZoomPosition({ x: 0, y: 0 })
                  closeImageModal()
                  setIsDetailsModalOpen(true)
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Cerrar y volver
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
