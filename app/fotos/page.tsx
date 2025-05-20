"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { db } from "@/lib/firebase/firebase-config"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"

export default function PhotosPage() {
  const searchParams = useSearchParams()
  const yearParam = searchParams.get("year")

  const [photos, setPhotos] = useState([])
  const [years, setYears] = useState([])
  const [selectedYear, setSelectedYear] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const yearsRef = collection(db, "eventYears")
        const snapshot = await getDocs(yearsRef)
        const yearsData = snapshot.docs.map((doc) => doc.data().year)
        setYears(yearsData.sort((a, b) => b - a)) // Sort years in descending order

        // Set default selected year
        if (yearParam && yearsData.includes(yearParam)) {
          setSelectedYear(yearParam)
        } else if (yearsData.length > 0) {
          setSelectedYear(yearsData[0].toString())
        }
      } catch (error) {
        console.error("Error fetching years:", error)
      }
    }

    fetchYears()
  }, [yearParam])

  useEffect(() => {
    const fetchPhotos = async () => {
      if (!selectedYear) return

      setLoading(true)
      try {
        const photosRef = collection(db, "photos")
        const q = query(photosRef, where("year", "==", selectedYear), orderBy("order", "asc"))
        const snapshot = await getDocs(q)
        const photosData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setPhotos(photosData)
      } catch (error) {
        console.error("Error fetching photos:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPhotos()
  }, [selectedYear])

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
            Galería de Fotos
          </h1>
          <p className="text-lg text-gray-600">Revive los mejores momentos de la edicion 2024</p>
        </div>

        {years.length > 0 ? (
          <Tabs defaultValue={selectedYear} className="w-full mb-8" onValueChange={setSelectedYear}>
            <div className="flex justify-center mb-6">
              <TabsList>
                {years.map((year) => (
                  <TabsTrigger key={year} value={year.toString()}>
                    Edición {year}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {years.map((year) => (
              <TabsContent key={year} value={year.toString()} className="mt-0">
                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-lg text-gray-500">Cargando fotos...</p>
                  </div>
                ) : photos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photos.map((photo) => (
                      <div key={photo.id} className="relative group overflow-hidden rounded-lg">
                        <div className="aspect-square relative">
                          <Image
                            src={photo.url || "/placeholder.svg"}
                            alt={photo.description || `Foto del evento ${year}`}
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
                ) : (
                  <div className="text-center py-12 bg-blue-50 rounded-lg">
                    <p className="text-lg text-blue-700">No hay fotos disponibles para esta edición todavía.</p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="text-center py-12 bg-blue-50 rounded-lg">
            <p className="text-lg text-blue-700">No hay fotos disponibles todavía, las fotos se publicaran una vez termine el evento </p>
          </div>
        )}

        <div className="flex justify-center mt-8">
          <Link href="/">
            <Button variant="outline">Volver al inicio</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
