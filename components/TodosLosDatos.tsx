"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export const TodosLosDatosModal = ({ registration, open, onOpenChange }) => {
  if (!registration) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Datos completos de {registration.nombre} {registration.apellido}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna 1 */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Información Personal</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">Nombre:</span> {registration.nombre || '-'}</p>
                <p><span className="text-gray-500">Apellido:</span> {registration.apellido || '-'}</p>
                <p><span className="text-gray-500">DNI:</span> {registration.dni || '-'}</p>
                <p><span className="text-gray-500">Fecha Nacimiento:</span> {registration.fechaNacimiento || '-'}</p>
                <p><span className="text-gray-500">Género:</span> {registration.genero || '-'}</p>
                <p><span className="text-gray-500">Grupo Sanguíneo:</span> {registration.grupoSanguineo || '-'}</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Datos del Evento</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">Talle remera:</span> {registration.talleRemera?.toUpperCase() || '-'}</p>
                <p><span className="text-gray-500">Grupo ciclistas:</span> {registration.grupoCiclistas || '-'}</p>
                <p><span className="text-gray-500">Fecha inscripción:</span> {registration.fechaInscripcion?.toLocaleDateString?.('es-ES') || '-'}</p>
              </div>
            </div>
          </div>

          {/* Columna 2 */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Contacto</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">Email:</span> {registration.email || '-'}</p>
                <p><span className="text-gray-500">Teléfono:</span> {registration.telefono || '-'}</p>
                <p><span className="text-gray-500">Teléfono emergencia:</span> {registration.telefonoEmergencia || '-'}</p>
                <p><span className="text-gray-500">Localidad:</span> {registration.localidad || '-'}</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Estado</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-500">Estado:</span>{" "}
                  {registration.estado === "confirmado" ? (
                    <Badge className="bg-green-500 hover:bg-green-600">Confirmado</Badge>
                  ) : registration.estado === "rechazado" ? (
                    <Badge className="bg-red-500 hover:bg-red-600">Rechazado</Badge>
                  ) : (
                    <Badge className="bg-yellow-500 hover:bg-yellow-600">Pendiente</Badge>
                  )}
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Condiciones de Salud</h3>
              <div className="text-sm">
                <p className="whitespace-pre-wrap">
                  {registration.condicionSalud || 
                   registration.condicionesSalud || 
                   'No especificó condiciones de salud'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}