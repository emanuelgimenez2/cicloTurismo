"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { db } from "../lib/firebase/firebase-config"
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"


// Datos predeterminados para cuando Firebase no está disponible
const defaultPhotos = [
  {
    id: "photo-1",
    url: "/foto 1 pc.jpg?height=300&width=300",
    description: "Participantes en la línea de salida",
  },
  {
    id: "photo-2",
    url: "/foto 2 pc.jpg?height=300&width=300",
    description: "Recorriendo los paisajes de Entre Ríos",
  },
  {
    id: "photo-3",
    url: "/foto 3 pc.jpg?height=300&width=300",
    description: "Parada de hidratación",
  },
  {
    id: "photo-4",
    url: "/foto 4 pc.jpg?height=300&width=300",
    description: "Llegada a las termas",
  },
  {
    id: "photo-5",
    url: "/foto 5 pc.jpg?height=300&width=300",
    description: "Entrega de premios",
  },
  {
    id: "photo-6",
    url: "/foto 6 pc.jpg?height=300&width=300",
    description: "Entrega de premios",
  },
]

export default function PhotosSection() {
  const { eventSettings, isFirebaseAvailable } = useFirebaseContext()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPhotos = async () => {
      if (!isFirebaseAvailable) {
        setPhotos(defaultPhotos)
        setLoading(false)
        return
      }

      try {
        const photosRef = collection(db, "photos")
        const currentYearPhotos = query(
          photosRef,
          where("year", "==", eventSettings?.currentYear || new Date().getFullYear()),
          orderBy("order", "asc"),
          limit(5),
        )
        const snapshot = await getDocs(currentYearPhotos)

        const photosData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        setPhotos(photosData.length > 0 ? photosData : defaultPhotos)
      } catch (error) {
        console.error("Error fetching photos:", error)
        setPhotos(defaultPhotos)
      } finally {
        setLoading(false)
      }
    }

    fetchPhotos()
  }, [eventSettings, isFirebaseAvailable])

  if (loading) {
    return (
      <div className="container mx-auto px-4 text-center">
        <p>Cargando...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
          Galería de Fotos
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 mx-auto mb-4"></div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Revive los mejores momentos del Cicloturismo Termal de Federación
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 mb-8">
        {photos.map((photo) => (
          <div key={photo.id} className="relative group overflow-hidden rounded-lg">
            <div className="aspect-square relative">
              <Image
                src={photo.url || "/placeholder.svg"}
                alt={photo.description || "Foto del evento"}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            {photo.description && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-sm">{photo.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-center">
        <Link href="/fotos">
          <Button variant="outline" className="border-pink-500 text-pink-700 hover:bg-pink-50">
            Ver todas las fotos
          </Button>
        </Link>
      </div>
    </div>
  )
}
