"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { db } from "../lib/firebase/firebase-config"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"

// Datos predeterminados para cuando Firebase no está disponible
const defaultSponsors = [
  {
    id: "sponsor-1",
    name: "Indumentaria  Deportiva Personalizada",
    logoUrl: "/sponsor 1.jpg?height=100&width=200",
    url: "https://www.instagram.com/induo.sport",
  },
  {
    id: "sponsor-2",
    name: "Foxes Bikes Ciclo Tours",
    logoUrl: "/sponsor 3.png?height=100&width=200",
    url: "https://linktr.ee/Foxesbikesciclotours",
  },
  {
    id: "sponsor-3",
    name: "Pedal Power",
    logoUrl: "/sponsor 2.png?height=100&width=200",
    url: "https://www.instagram.com/pedal_powerbikersfederacion_er",
  },
  {
    id: "sponsor-4",
    name: "El Mangrullo",
    logoUrl: "/sponsor 4.jpg?height=100&width=200",
    url: "https://linktr.ee/elmangrullo",
  },
  {
    id: "sponsor-5",
    name: "SetviTec",
    logoUrl: "/sponsor 5.jpg?height=100&width=200",
    url: "https://linktr.ee/serviteccdelu",
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

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {sponsors.map((sponsor) => (
          <Link
            key={sponsor.id}
            href={sponsor.url || "#"}
            target={sponsor.url ? "_blank" : "_self"}
            className="flex flex-col items-center group"
          >
            <div className="relative aspect-square w-full bg-white rounded-lg overflow-hidden shadow-sm transition-transform group-hover:scale-105">
              <Image
                src={sponsor.logoUrl || "/placeholder.svg"}
                alt={sponsor.name}
                fill
                className="object-cover"
              />
            </div>
            <p className="text-sm font-medium text-center mt-2">{sponsor.name}</p>
          </Link>
        ))}
      </div>
      <div className="text-center mb-13 mt-2">
        <p className="text-lg text-gray-600 max-w-5xl mx-auto">Contactate con nosotros para ser un sponsor</p>
      </div>
    </div>
  )
}
