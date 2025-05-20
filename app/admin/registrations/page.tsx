"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { db } from "@/lib/firebase/firebase-config"
import { collection, getDocs, orderBy, query, doc, updateDoc } from "firebase/firestore"
import { getDownloadURL, ref } from "firebase/storage"
import { Download, Search, Filter, Eye, FileText, FileSpreadsheet, Save, X } from "lucide-react"
 

// Importa EmailJS
import emailjs from '@emailjs/browser';

// Inicializa EmailJS
if (typeof window !== 'undefined') {
  emailjs.init('qZ1uWOlXB-rlAsutR');
}

// Función para formatear fechas
const formatDate = (dateString) => {
  if (!dateString) return null;
  
  // Si ya está en formato día/mes/año, lo dejamos igual
  if (dateString.includes('/')) return dateString;
  
  // Si está en formato ISO (YYYY-MM-DD)
  if (dateString.includes('-')) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }
  
  return dateString;
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
  const [zoomedImage, setZoomedImage] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const registrationsRef = collection(db, "participantes2025")
        const allRegistrations = query(
          registrationsRef,
          orderBy("fechaInscripcion", "desc")
        )
        const snapshot = await getDocs(allRegistrations)

        const registrationsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          fechaInscripcion: doc.data().fechaInscripcion?.toDate?.() || new Date(),
          fechaNacimiento: formatDate(doc.data().fechaNacimiento) || '-',
        }))

        const years = [...new Set(registrationsData.map(reg => reg.fechaInscripcion.getFullYear()))]
        setAvailableYears(years.sort((a, b) => b - a))

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
          reg.localidad?.toLowerCase().includes(term)
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((reg) => reg.estado === statusFilter)
    }

    if (yearFilter !== "all") {
      filtered = filtered.filter((reg) => reg.fechaInscripcion.getFullYear() === parseInt(yearFilter))
    }

    setFilteredRegistrations(filtered)
  }, [searchTerm, statusFilter, yearFilter, registrations])

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
      setIsDragging(true);
      setDragStart({
        x: e.clientX - zoomPosition.x,
        y: e.clientY - zoomPosition.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoomedImage) {
      setZoomPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };
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
        nombre: participant.nombre || '',
        apellido: participant.apellido || '',
        dni: participant.dni || '',
        email: participant.email,
        telefono: participant.telefono || '',
        localidad: participant.localidad || '',
        genero: participant.genero || '',
        talleRemera: participant.talleRemera || '',
        fechaInscripcion: participant.fechaInscripcion.toLocaleDateString('es-ES'),
      }

      const response = await emailjs.send(
        'default_service',
        'template_2fg4bhx',
        templateParams
      )

      console.log('Email enviado con éxito:', response)
      return true
    } catch (error) {
      console.error('Error al enviar el correo de confirmación:', error)
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
        fechaActualizacion: new Date()
      }

      await updateDoc(registrationRef, updateData)

      if (newStatus === "confirmado" && selectedRegistration.estado !== "confirmado") {
        const emailSent = await sendConfirmationEmail(selectedRegistration)
        if (emailSent) {
          await updateDoc(registrationRef, {
            emailEnviado: true,
            fechaEmailEnviado: new Date()
          })
        }
      }

      setRegistrations(prev => prev.map(reg => 
        reg.id === selectedRegistration.id 
          ? { 
              ...reg, 
              ...updateData, 
              fechaActualizacion: new Date(),
              emailEnviado: newStatus === "confirmado" ? true : reg.emailEnviado
            }
          : reg
      ))

      alert("Estado actualizado correctamente" + 
        (newStatus === "confirmado" && selectedRegistration.estado !== "confirmado" 
          ? " y correo de confirmación enviado" 
          : ""))
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
      .filter(reg => reg.estado === "confirmado")
      .sort((a, b) => a.apellido?.localeCompare(b.apellido) || 0);
      
    
    
    // Verificar campos disponibles (para debugging)
   
    
    // Calcular totales por grupo de bici (comprobando diferentes posibles nombres de campo)
    const gruposBici = {};
    approvedRegistrations.forEach(reg => {
      // Usar el nombre correcto del campo: grupoCiclistas
      const grupoBici = reg.grupoCiclistas || reg.grupoBici || reg.grupo_bici || reg.grupobici || reg.grupo || "Sin especificar";
      gruposBici[grupoBici] = (gruposBici[grupoBici] || 0) + 1;
    });
    
    // Preparar resumen de grupos
    const resumenGruposBici = Object.entries(gruposBici)
      .map(([grupo, cantidad]) => `${grupo}: ${cantidad}`)
      .join('<br>');
      
    let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Lista de Participantes Confirmados</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
        h1, h2, h3 { color: #333; text-align: center; }
        .header { text-align: center; margin-bottom: 15px; }
        .summary { margin-bottom: 20px; border: 1px solid #ccc; padding: 10px; background-color: #f5f5f5; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        @media print {
          .no-break { page-break-inside: avoid; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>Lista de Participantes</h2>
        <p>Fecha de generación: ${new Date().toLocaleDateString()}</p>
      </div>
      <div class="summary">
        <p>Total de participantes confirmados: <strong>${approvedRegistrations.length}</strong></p>
        ${Object.keys(gruposBici).length > 0 ? 
          `<p>Total por grupo de bici: ${resumenGruposBici}</p>` : 
          '<p>No hay información de grupos de bici disponible</p>'}
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
          ${approvedRegistrations.map((reg, index) => {
            // Usar los nombres correctos de los campos
            const grupoBici = reg.grupoCiclistas || reg.grupoBici || reg.grupo_bici || reg.grupobici || reg.grupo || '';
            
     // Manejar el campo condicionSalud (puede ser string, objeto o JSON string)
let condicionesDeSalud = '';

if (reg.condicionSalud) {
    // Caso 1: Si es un string que parece JSON (ej: `{"condicionSalud":"estoy bien"}`)
    if (typeof reg.condicionSalud === 'string' && reg.condicionSalud.trim().startsWith('{')) {
        try {
            const parsed = JSON.parse(reg.condicionSalud);
            condicionesDeSalud = parsed.condicionSalud || parsed.condicionesSalud || '';
        } catch (e) {
            condicionesDeSalud = reg.condicionSalud; // Si falla el parseo, se queda como string
        }
    }
    // Caso 2: Si es un objeto directo (ej: `{ condicionSalud: "estoy bien" }`)
    else if (typeof reg.condicionSalud === 'object') {
        condicionesDeSalud = reg.condicionSalud.condicionSalud || reg.condicionSalud.condicionesSalud || '';
    }
    // Caso 3: Si es un string normal (ej: "estoy re biennnnnn :)")
    else {
        condicionesDeSalud = reg.condicionSalud;
    }
}
//
            const telefonoEmergencia = reg.telefonoEmergencia || reg.telefono_emergencia || reg.telEmergencia || reg.telefonoContacto || '';
            const grupoSanguineo = reg.grupoSanguineo || reg.grupo_sanguineo || reg.gruposanguineo || reg.sangre || '';
            
            return `
            <tr>
              <td>${index + 1}</td>
              <td>${reg.apellido || ''}, ${reg.nombre || ''}</td>
              <td>${reg.dni || ''}</td>
              <td>${reg.telefono || ''}</td>
              <td>${telefonoEmergencia}</td>
              <td>${grupoSanguineo}</td>
              <td>${grupoBici}</td>
              <td>${reg.localidad || ''}</td>
              <td>${reg.talleRemera || ''}</td>
              <td>${condicionesDeSalud}</td>
            </tr>
          `}).join('')}
        </tbody>
      </table>
    </body>
    </html>
    `;
    
    // Crear y descargar el archivo HTML (que puede ser convertido a PDF)
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `participantes_confirmados_${new Date().toISOString().split("T")[0]}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmado":
        return <Badge className="bg-green-500 hover:bg-green-600">Confirmado</Badge>
      case "pendiente":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pendiente</Badge>
      case "rechazado":
        return <Badge className="bg-red-500 hover:bg-red-600">Rechazado</Badge>
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-600">Pendiente</Badge>
    }
  }
  const getStatistics = () => {
    const total = filteredRegistrations.length
    const confirmados = filteredRegistrations.filter(reg => reg.estado === "confirmado").length
    const pendientes = filteredRegistrations.filter(reg => reg.estado === "pendiente" || !reg.estado).length
    const rechazados = filteredRegistrations.filter(reg => reg.estado === "rechazado").length
    
    return { total, confirmados, pendientes, rechazados }
  }

  const stats = getStatistics()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inscripciones</h1>
        <p className="text-muted-foreground">Gestiona todas las inscripciones al evento</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.confirmados}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendientes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rechazados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rechazados}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Inscripciones</CardTitle>
          <CardDescription>
            Mostrando {filteredRegistrations.length} de {registrations.length} inscripciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, apellido, DNI, email, teléfono o localidad"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="rechazado">Rechazado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
             
              <Button variant="outline" onClick={exportApprovedToPDF} disabled={registrations.filter(r => r.estado === "confirmado").length === 0}>
                <FileText className="mr-2 h-4 w-4" />
                Confirmados PDF
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
                    <TableHead>Localidad</TableHead>
                    <TableHead>Talle</TableHead>
                    <TableHead>Fecha Nacimiento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegistrations.map((registration) => (
                    <TableRow key={registration.id}>
                      <TableCell className="font-medium">{registration.nombre || '-'}</TableCell>
                      <TableCell>{registration.apellido || '-'}</TableCell>
                      <TableCell>{registration.dni || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">{registration.email || '-'}</TableCell>
                      <TableCell>{registration.telefono || '-'}</TableCell>
                      <TableCell>{registration.localidad || '-'}</TableCell>
                      <TableCell className="uppercase">{registration.talleRemera || '-'}</TableCell>
                      <TableCell>{registration.fechaNacimiento || '-'}</TableCell>
                      <TableCell>{getStatusBadge(registration.estado)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openDetailsModal(registration)}>
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
            <div className="text-center py-8 border rounded-md">
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" || yearFilter !== "all" 
                  ? "No se encontraron inscripciones con los filtros aplicados" 
                  : "No hay inscripciones registradas"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de Inscripción</DialogTitle>
            <DialogDescription>
              Información completa del participante
            </DialogDescription>
          </DialogHeader>
          
          {selectedRegistration && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-10xl0 mx-auto">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Nombre completo</Label>
                  <p className="text-sm">{selectedRegistration.nombre} {selectedRegistration.apellido}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">DNI</Label>
                  <p className="text-sm">{selectedRegistration.dni || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <p className="text-sm">{selectedRegistration.email || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Teléfono</Label>
                  <p className="text-sm">{selectedRegistration.telefono || '-'}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-500">Telefono De Emergencia</Label>
                  <p className="text-sm">{selectedRegistration.telefonoEmergencia || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Localidad</Label>
                  <p className="text-sm">{selectedRegistration.localidad || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Género</Label>
                  <p className="text-sm">{selectedRegistration.genero || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Talle de remera</Label>
                  <p className="text-sm uppercase">{selectedRegistration.talleRemera || '-'}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-500">Fecha de Inscripción</Label>
                  <p className="text-sm">{selectedRegistration.fechaInscripcion?.toLocaleDateString('es-ES') || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Grupo Sanguineo</Label>
                  <p className="text-sm">{selectedRegistration.grupoSanguineo || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">condicionesSalud</Label>
                  <p className="text-sm">{selectedRegistration.condicionesSalud || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Grupo Ciclistas</Label>
                  <p className="text-sm">{selectedRegistration.grupoCiclistas || '-'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label>Comprobante de pago</Label>
                  {loadingComprobante ? (
                    <div className="flex items-center justify-center h-40 border rounded-md">
                      <p>Cargando comprobante...</p>
                    </div>
                  ) : comprobanteUrl ? (
                    <div className="border rounded-md p-2">
                      {selectedRegistration.comprobantePagoUrl?.endsWith('.pdf') || 
                      selectedRegistration.nombreArchivo?.endsWith('.pdf') ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-center h-40 border rounded-md">
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
                          className="cursor-pointer border rounded-md p-2"
                          onClick={() => {
                            setIsDetailsModalOpen(false)
                            setIsImageModalOpen(true)
                          }}
                        >
                          <img 
                            src={comprobanteUrl} 
                            alt="Comprobante de pago" 
                            className="max-h-60 mx-auto object-contain"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-20 border rounded-md">
                      <p className="text-gray-500">No hay comprobante disponible</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="note">Nota (opcional)</Label>
                  <Textarea
                    id="note"
                    placeholder="Agregar una nota sobre esta inscripción..."
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    rows={10}
                  />
                </div>
                
                <div>
                  <Label htmlFor="status">Estado de la inscripción</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="confirmado">Confirmado</SelectItem>
                      <SelectItem value="rechazado">Rechazado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDetailsModal}>
              <X className="mr-2 h-4 w-4" />
              Cerrar
            </Button>
            <Button 
              onClick={updateRegistrationStatus} 
              disabled={updatingStatus || sendingEmail}
              className="min-w-32"
            >
              <Save className="mr-2 h-4 w-4" />
              {updatingStatus ? "Guardando..." : sendingEmail ? "Enviando email..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isImageModalOpen} onOpenChange={(open) => {
        if (!open) {
          setZoomedImage(false);
          setZoomPosition({ x: 0, y: 0 });
        }
        setIsImageModalOpen(open);
      }}>
        <DialogContent className="max-w-[80vw] max-h-[100vh]">
          <DialogHeader>
            <DialogTitle>Comprobante de Pago</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center h-full overflow-hidden">
            {selectedRegistration?.comprobantePagoUrl?.endsWith('.pdf') || 
            selectedRegistration?.nombreArchivo?.endsWith('.pdf') ? (
              <iframe 
                src={comprobanteUrl} 
                className="w-full h-[90vh] border-none"
                title="Comprobante de pago ampliado"
              />
            ) : (
              <div 
                className="relative w-full h-full"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <div 
                  className="w-full h-full flex justify-center items-center overflow-hidden"
                  onClick={() => !isDragging && setZoomedImage(!zoomedImage)}
                >
                  <img 
                    src={comprobanteUrl} 
                    alt="Comprobante de pago ampliado" 
                    className={`${zoomedImage ? 'cursor-move' : 'cursor-zoom-in'} transition-transform duration-300`}
                    style={{
                      transform: zoomedImage 
                        ? `scale(1.5) translate(${zoomPosition.x}px, ${zoomPosition.y}px)`
                        : 'scale(1)',
                      maxWidth: zoomedImage ? 'none' : '100%',
                      maxHeight: zoomedImage ? 'none' : '90vh',
                      objectFit: 'contain'
                    }}
                  />
                </div>
                {zoomedImage && (
                  <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-md">
                    {isDragging ? 'Suelta para dejar de mover' : 'Arrastra para mover la imagen'}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setZoomedImage(false);
              setZoomPosition({ x: 0, y: 0 });
              closeImageModal();
            }}>
              <X className="mr-2 h-4 w-4" />
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}