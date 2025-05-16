"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { db } from "@/lib/firebase/firebase-config"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"

// Datos predeterminados para cuando Firebase no está disponible
const defaultSponsors = [
  {
    id: "sponsor-1",
    name: "Municipalidad de Federación",
    logoUrl: "/placeholder.svg?height=100&width=200",
    url: "#",
  },
  {
    id: "sponsor-2",
    name: "Termas de Federación",
    logoUrl: "/placeholder.svg?height=100&width=200",
    url: "#",
  },
  {
    id: "sponsor-3",
    name: "Bicicletas del Litoral",
    logoUrl: "/placeholder.svg?height=100&width=200",
    url: "#",
  },
  {
    id: "sponsor-4",
    name: "Hotel Termal",
    logoUrl: "/placeholder.svg?height=100&width=200",
    url: "#",
  },
  {
    id: "sponsor-5",
    name: "Deportes Entre Ríos",
    logoUrl: "/placeholder.svg?height=100&width=200",
    url: "#",
  },
]

export default function SponsorsSection() {
  const { eventSettings, isFirebaseAvailable } = useFirebaseContext()
  const [sponsors, setSponsors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSponsors = async () => {
      if (!isFirebaseAvailable) {
        setSponsors(defaultSponsors)
        setLoading(false)
        return
      }

      try {
        const sponsorsRef = collection(db, "sponsors")
        const currentYearSponsors = query(
          sponsorsRef,
          where("year", "==", eventSettings?.currentYear || new Date().getFullYear()),
          orderBy("order", "asc"),
        )
        const snapshot = await getDocs(currentYearSponsors)

        const sponsorsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        setSponsors(sponsorsData.length > 0 ? sponsorsData : defaultSponsors)
      } catch (error) {
        console.error("Error fetching sponsors:", error)
        setSponsors(defaultSponsors)
      } finally {
        setLoading(false)
      }
    }

    fetchSponsors()
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
          Nuestros Sponsors
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 mx-auto mb-4"></div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">Empresas que hacen posible este evento</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 max-w-5xl mx-auto">
        {sponsors.map((sponsor) => (
          <Link
            key={sponsor.id}
            href={sponsor.url || "#"}
            target={sponsor.url ? "_blank" : "_self"}
            className="flex flex-col items-center group"
          >
            <div className="relative h-24 w-full mb-2 bg-white rounded-lg p-2 flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
              <Image
                src={sponsor.logoUrl || "/placeholder.svg?height=100&width=200"}
                alt={sponsor.name}
                width={150}
                height={80}
                className="object-contain max-h-20"
              />
            </div>
            <p className="text-sm font-medium text-center">{sponsor.name}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
