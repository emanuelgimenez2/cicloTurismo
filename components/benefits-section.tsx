"use client"

import { useState, useEffect } from "react"
import { Check } from "lucide-react"
import { db } from "@/lib/firebase/firebase-config"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"

// Datos predeterminados para cuando Firebase no está disponible
const defaultBenefits = [
  { id: "1", text: "Jersey oficial del evento" },
  { id: "2", text: "Buff y bolsita kit" },
  { id: "3", text: "Desayuno antes de la partida" },
  { id: "4", text: "Frutas y agua en paradas" },
  { id: "5", text: "Seguro de accidentes" },
  { id: "6", text: "Asistencia médica" },
  { id: "7", text: "Asistencia técnica" },
  { id: "8", text: "Vehículo de apoyo" },
]

export default function BenefitsSection() {
  const { eventSettings, isFirebaseAvailable } = useFirebaseContext()
  const [benefits, setBenefits] = useState(defaultBenefits)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBenefits = async () => {
      if (!isFirebaseAvailable) {
        setBenefits(defaultBenefits)
        setLoading(false)
        return
      }

      try {
        const benefitsRef = collection(db, "benefits")
        const currentYearBenefits = query(
          benefitsRef,
          where("year", "==", eventSettings?.currentYear || new Date().getFullYear()),
          orderBy("order", "asc"),
        )
        const snapshot = await getDocs(currentYearBenefits)

        const benefitsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        setBenefits(benefitsData.length > 0 ? benefitsData : defaultBenefits)
      } catch (error) {
        console.error("Error fetching benefits:", error)
        setBenefits(defaultBenefits)
      } finally {
        setLoading(false)
      }
    }

    fetchBenefits()
  }, [eventSettings, isFirebaseAvailable])

  if (loading) {
    return (
      <div className="container mx-auto px-2 text-center">
        <p>Cargando...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
          Beneficios de la Inscripción
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 mx-auto mb-4"></div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Tu inscripción al Cicloturismo Termal de Federación incluye:
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5x1 mx-auto">
        {benefits.map((benefit) => (
          <div key={benefit.id} className="flex items-start space-x-2 bg-white p-2 rounded-lg shadow-sm">
            <div className="flex-shrink-0 mx-1 md:mx-1">
              <div className="h-5 w-5 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 flex items-center justify-left">
                <Check className="h-3 w-3 text-white" />
              </div>
            </div>
            <p>{benefit.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}


