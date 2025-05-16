"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { db } from "@/lib/firebase/firebase-config"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"

// Datos de ejemplo para cuando Firebase no está disponible
const defaultSlides = [
  {
    id: "default-1",
    imageUrl: "/foto 4.jpg?height=600&width=1200",
    title: "Cicloturismo Termal de Federación",
    subtitle: "Segunda Edición - 12 de octubre de 2025",
    buttonText: "Inscribirme ahora",
    buttonUrl: "/inscripcion",
  },
  {
    id: "default-2",
    imageUrl: "/foto 1.jpg?height=600&width=1200",
    title: "Recorre los paisajes de Entre Ríos",
    subtitle: "50 km de aventura y naturaleza",
    buttonText: "Conoce más",
    buttonUrl: "/#beneficios",
  },
]

export default function CarouselSection() {
  const { eventSettings, isFirebaseAvailable } = useFirebaseContext()
  const [slides, setSlides] = useState(defaultSlides)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCarouselImages = async () => {
      if (!isFirebaseAvailable) {
        setSlides(defaultSlides)
        setLoading(false)
        return
      }

      try {
        const carouselRef = collection(db, "carousel")
        const currentYearCarousel = query(
          carouselRef,
          where("year", "==", eventSettings?.currentYear || new Date().getFullYear()),
          orderBy("order", "asc"),
        )
        const snapshot = await getDocs(currentYearCarousel)

        const slidesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        setSlides(slidesData.length > 0 ? slidesData : defaultSlides)
      } catch (error) {
        console.error("Error fetching carousel images:", error)
        setSlides(defaultSlides)
      } finally {
        setLoading(false)
      }
    }

    fetchCarouselImages()
  }, [eventSettings, isFirebaseAvailable])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
  }

  useEffect(() => {
    if (slides.length <= 1) return

    const interval = setInterval(() => {
      nextSlide()
    }, 5000)

    return () => clearInterval(interval)
  }, [currentSlide, slides.length])

  if (loading) {
    return (
      <div className="relative h-screen flex items-center justify-center bg-gray-100">
        <p>Cargando...</p>
      </div>
    )
  }

  return (
    <div className="relative h-screen overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="relative h-full w-full">
            <Image
              src={slide.imageUrl || "/placeholder.svg"}
              alt={slide.title || "Carousel image"}
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
              <h1 className="text-3xl md:text-5xl font-bold mb-4 max-w-3xl">
                {slide.title || "Cicloturismo Termal de Federación"}
              </h1>
              <p className="text-lg md:text-xl mb-8 max-w-2xl">
                {slide.subtitle || "Segunda Edición - 12 de octubre de 2025"}
              </p>
              {slide.buttonText && (
                <Link href={slide.buttonUrl || "/inscripcion"}>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 hover:from-pink-600 hover:via-violet-600 hover:to-blue-600"
                  >
                    {slide.buttonText}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}

      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full ${index === currentSlide ? "bg-white" : "bg-white/50"}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
