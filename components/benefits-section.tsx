"use client"

import { useState } from "react"
import {
  Calendar,
  MapPin,
  Clock,
  Route,
  Navigation,
  TrendingUp,
  Users,
  DollarSign,
  Shirt,
  Package,
  Coffee,
  Apple,
  Shield,
  Heart,
  Wrench,
  Truck,
} from "lucide-react"
import Contador from "@/components/Contador" // Importamos el componente Contador

// Datos predeterminados para cuando Firebase no está disponible
const defaultBenefits = [
  { id: "1", text: "Jersey oficial del evento", icon: Shirt },
  { id: "2", text: "Buff y bolsita kit", icon: Package },
  { id: "3", text: "Desayuno antes de la partida", icon: Coffee },
  { id: "4", text: "Frutas y agua en paradas", icon: Apple },
  { id: "5", text: "Seguro de accidentes", icon: Shield },
  { id: "6", text: "Asistencia médica", icon: Heart },
  { id: "7", text: "Asistencia técnica", icon: Wrench },
  { id: "8", text: "Vehículo de apoyo", icon: Truck },
]

// Datos del evento
const eventData = [
  { icon: Calendar, label: "Fecha", value: "12 de Octubre" },
  { icon: Route, label: "Distancia", value: "50 KM caminos rurales" },
  { icon: MapPin, label: "Ubicación", value: "Federación, Entre Ríos, Argentina" },
  { icon: TrendingUp, label: "Nivel", value: "Intermedio - Avanzado" },
  { icon: Users, label: "Edad Mínima", value: "18 años" },
  { icon: DollarSign, label: "Precio", value: "$35.000" },
  { icon: Clock, label: "Acreditación", value: "7:30 hs" },
  { icon: Clock, label: "Hora de Salida", value: "8:30 hs" },
  { icon: Navigation, label: "Lugar de encuentro", value: "Dirección de Deportes" },
  { icon: Navigation, label: "Lugar de llegada", value: "Dirección de Deportes" },
]

export default function BenefitsSection() {
  const [benefits] = useState(defaultBenefits)

  return (
    <div className="container mx-auto px-4 space-y-16">
      {/* Sección Datos del Evento */}

      {/* Insertamos el componente Contador aquí, entre ambas secciones 
           Sin pasar la prop eventDate para que use la configuración interna */}
      <Contador />
      <div>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
            Evento
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Información importante</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 max-w-6xl mx-auto">
          {eventData.map((item, index) => {
            const IconComponent = item.icon
            return (
              <div
                key={index}
                className="bg-white p-3 md:p-6 rounded-lg md:rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex items-center space-x-2 md:space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 md:h-12 md:w-12 rounded-full bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 flex items-center justify-center">
                      <IconComponent className="h-4 w-4 md:h-6 md:w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide">
                      {item.label}
                    </h3>
                    <p className="text-sm md:text-lg font-semibold text-gray-900 mt-1 leading-tight">{item.value}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sección Beneficios de la Inscripción */}
      <div>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
            Beneficios de la Inscripción
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Incluye:</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {benefits.map((benefit) => {
            const IconComponent = benefit.icon
            return (
              <div key={benefit.id} className="flex items-start space-x-2 bg-white p-2 rounded-lg shadow-sm">
                <div className="flex-shrink-0 mx-1 md:mx-1">
                  <div className="h-5 w-5 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 flex items-center justify-center">
                    <IconComponent className="h-3 w-3 text-white" />
                  </div>
                </div>
                <p>{benefit.text}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
