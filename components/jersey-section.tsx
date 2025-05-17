"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { db } from "@/lib/firebase/firebase-config"
import { doc, getDoc } from "firebase/firestore"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"


const defaultJerseyData = {
  title: "Pedal Power",
  description: `<p style="text-align: justify;">Somos Pedal Power, un grupo de amigos unidos por una misma pasión: el ciclismo.</p><p style="text-align: justify;">Nacimos con la simple idea de salir a pedalear cada vez que podíamos, disfrutando del camino, del aire libre y de la compañía.</p><p style="text-align: justify;">Con el tiempo, esa pasión se transformó en un compromiso: aumentamos la frecuencia de nuestras salidas, recorrimos más kilómetros y nos animamos a participar en cicloturismos por toda la región, incluyendo en la vecina y muy querida República Oriental del Uruguay.</p><p style="text-align: justify;">Esas experiencias nos inspiraron a dar un paso más: organizar nuestro propio evento.</p><p style="text-align: justify;">Así nació el Cicloturismo Termal en Federación, Entre Ríos. La primera edición, en octubre del 2024, fue un éxito rotundo y nos impulsó a seguir creciendo.</p><p style="text-align: justify;">Hoy, seguimos pedaleando con la misma alegría del primer día, pero con la convicción de que este camino recién comienza. Nos mueve la pasión, el compañerismo y el deseo de compartir esta experiencia con más personas.</p><p style="text-align: justify;">    </p><p style="text-align: justify;">   </p><p style="text-align: justify;">¿Te sumás a vivir la Segunda Edición del Cicloturismo Termal?              </p>`,
  imageUrl: "/pedalpower.jpg",
}

const foxesData = {
  title: "Foxes Bikes Ciclo Tours",
  description: `<p style="text-align: justify;">Como integrante de Pedal Power, he compartido caminos, emociones y aprendizajes que marcaron mi vida. En plena organización de nuestro segundo evento del año 2024, "La Nocturna", junto a dos compañeras del grupo, Iarita y Claudia, vivimos algo que transformó nuestra mirada: el rescate de un zorrito herido.</p><p style="text-align: justify;">Ese momento de conexión profunda con la naturaleza fue la chispa que necesitaba para darle forma y nombre a un sueño que venía madurando hace tiempo.</p><p style="text-align: justify;">Así nació <strong>Foxes Bikes Ciclo Tours</strong>, una propuesta que combina todo lo que amo del cicloturismo grupal, pero llevada a una escala más íntima. Es una invitación a vivir un fin de semana completo con todo resuelto: alojamiento, comidas, circuitos guiados y actividades, ideal para venir en familia, con amigos (bikers o no) o incluso solo/a.</p><p style="text-align: justify;">No hace falta experiencia, solo ganas de disfrutar. Mi misión es que te desconectes del ruido cotidiano y te reconectes con la naturaleza, con la bici y con vos mismo/a.</p><p style="text-align: justify;"><strong>Cupos limitados. Experiencia única. Bienvenidos a rodar distinto.</strong></p><p><strong>Contacto:</strong> Brunilda Schubert<br /><strong>Celular:</strong> 3456 530720</p>`,
  imageUrl: "/foxes.jpg",
}

function SectionHeader({ image, title }) {
  return (
    <div className="flex flex-col items-center text-center mb-8">
      <div className="flex items-center gap-4">
        <Image
          src={image}
          alt={`Logo ${title}`}
          width={60}
          height={60}
          className="object-contain"
          priority
        />
        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 via-violet-600 to-blue-600 bg-clip-text text-transparent">
          {title}
        </h2>
      </div>
      <div className="w-24 h-1 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 mt-2" />
    </div>
  )
}

function CollapsibleText({ html, imageUrl }) {
  const [showModal, setShowModal] = useState(false)
  const [shouldTruncate, setShouldTruncate] = useState(false)
  const [processedContent, setProcessedContent] = useState({
    previewHtml: html,
    fullHtml: html,
    hasMore: false,
  })

  const calculateMaxChars = (width) => {
    if (width > 1100) return 1300
    if (width > 990) return 900
    if (width > 800) return 600
    if (width > 700) return 500
    return 250
  }

  const processHtml = (htmlContent, maxChars) => {
    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = htmlContent
    const plainText = tempDiv.textContent || tempDiv.innerText || ""

    if (plainText.length > maxChars) {
      let truncatedText = plainText.substring(0, maxChars)
      const lastSpace = truncatedText.lastIndexOf(" ")
      if (lastSpace > 0) truncatedText = truncatedText.substring(0, lastSpace)
      truncatedText += "..."
      return {
        previewHtml: `<p style="text-align: justify;">${truncatedText}</p>`,
        hasMore: true,
      }
    }
    return {
      previewHtml: htmlContent,
      hasMore: false,
    }
  }

  useEffect(() => {
    const handleResize = () => {
      const maxChars = calculateMaxChars(window.innerWidth)
      const { previewHtml, hasMore } = processHtml(html, maxChars)
      setProcessedContent({
        previewHtml,
        fullHtml: html,
        hasMore,
      })
      setShouldTruncate(hasMore)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [html])

  return (
    <div className="prose max-w-none flex-1 relative">
      <div>
        {shouldTruncate ? (
          <>
            <div
              style={{ textAlign: "justify" }}
              dangerouslySetInnerHTML={{ __html: processedContent.previewHtml }}
            />
            <button
              onClick={() => setShowModal(true)}
              className="mt-2 text-blue-600 font-medium hover:underline focus:outline-none"
            >
              Leer más
            </button>
          </>
        ) : (
          <div
            style={{ textAlign: "justify" }}
            dangerouslySetInnerHTML={{ __html: processedContent.fullHtml }}
          />
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 px-4">

          <div className="bg-gradient-to-r from-pink-100 via-violet-100 to-blue-100 mt-2 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => setShowModal(false)}
            >
              ✕
            </button>
            {imageUrl && (
              <div className="w-full h-64 relative rounded-t-2xl overflow-hidden">
                <Image
                  src={imageUrl}
                  alt="Imagen completa"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-6 text-justify">
              <div dangerouslySetInnerHTML={{ __html: processedContent.fullHtml }} />
              <button
                onClick={() => setShowModal(false)}
                className="mt-4 text-blue-600 font-medium hover:underline"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}






export default function JerseySection() {
  const { eventSettings, isFirebaseAvailable } = useFirebaseContext()
  const [jerseyData, setJerseyData] = useState(defaultJerseyData)
  const [loading, setLoading] = useState(true)
  const IMAGE_HEIGHT = 300 // La altura de la imagen en píxeles

  useEffect(() => {
    const fetchJerseyData = async () => {
      if (!isFirebaseAvailable) {
        setLoading(false)
        return
      }

      try {
        const jerseyDoc = doc(db, "content", "historia")
        const docSnap = await getDoc(jerseyDoc)

        if (
          docSnap.exists() &&
          docSnap.data().year ===
            (eventSettings?.currentYear || new Date().getFullYear())
        ) {
          setJerseyData(docSnap.data())
        }
      } catch (error) {
        console.error("Error fetching jersey data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchJerseyData()
  }, [eventSettings, isFirebaseAvailable])

  if (loading) {
    return (
      <div className="container mx-auto px-4 text-center">
        <p>Cargando...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 space-y-24">
      {/* Sección Pedal Power */}
      <div>
        <SectionHeader image="/pedalpowerlogo.png" title={jerseyData.title} />
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative w-[300px] h-[300px] flex-shrink-0 mx-auto md:mx-0">
            <Image
              src={jerseyData.imageUrl || "/pedalpower.jpg"}
              alt="Nuestra Historia"
              fill
              className="object-cover rounded-3xl shadow-2xl"
              priority
            />
          </div>
          <CollapsibleText html={jerseyData.description} imageHeight={IMAGE_HEIGHT} />
        </div>
      </div>

      {/* Sección Foxes */}
      <div>
        <SectionHeader image="/foxeslogo.png" title={foxesData.title} />
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative w-[300px] h-[300px] flex-shrink-0 mx-auto md:mx-0">
            <Image
              src={foxesData.imageUrl || "/foxes.jpg"}
              alt="Foxes Bikes"
              fill
              className="object-cover rounded-3xl shadow-2xl"
              priority
            />
          </div>
          <CollapsibleText html={foxesData.description} imageHeight={IMAGE_HEIGHT} />
        </div>
      </div>
    </div>
  )
}
