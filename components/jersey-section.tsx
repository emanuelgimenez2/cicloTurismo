"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { db } from "@/lib/firebase/firebase-config"
import { doc, getDoc } from "firebase/firestore"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"

const defaultJerseyData = {
  title: "Pedal Power",
  description: `<p style="text-align: justify;">Somos Pedal Power, un grupo de amigos unidos por una misma pasión: el ciclismo. Nacimos con la simple idea de salir a pedalear cada vez que podíamos, disfrutando del camino, del aire libre y de la compañía.</p><p style="text-align: justify;">Con el tiempo, esa pasión se transformó en un compromiso: aumentamos la frecuencia de nuestras salidas, recorrimos más kilómetros y nos animamos a participar en cicloturismos por toda la región, incluyendo en la vecina y muy querida República Oriental del Uruguay.</p><p style="text-align: justify;">Esas experiencias nos inspiraron a dar un paso más: organizar nuestro propio evento. Así nació el Cicloturismo Termal en Federación, Entre Ríos. La primera edición, en octubre del 2024, fue un éxito rotundo y nos impulsó a seguir creciendo.</p><p style="text-align: justify;">Hoy, seguimos pedaleando con la misma alegría del primer día, pero con la convicción de que este camino recién comienza. Nos mueve la pasión, el compañerismo y el deseo de compartir esta experiencia con más personas.</p><p style="text-align: justify;">¿Te sumás a vivir la Segunda Edición del Cicloturismo Termal?</p>`,
  imageUrl: "/pedalpower.jpg",
}

const foxesData = {
  title: "Foxes Bikes Ciclo Tours",
  description: `<p style="text-align: justify;">Como integrante de Pedal Power, he compartido caminos, emociones y aprendizajes que marcaron mi vida. En plena organización de nuestro segundo evento del año 2024, “La Nocturna”, junto a dos compañeras del grupo, Iarita y Claudia, vivimos algo que transformó nuestra mirada: el rescate de un zorrito herido.</p><p style="text-align: justify;">Ese momento de conexión profunda con la naturaleza fue la chispa que necesitaba para darle forma y nombre a un sueño que venía madurando hace tiempo.</p><p style="text-align: justify;">Así nació <strong>Foxes Bikes Ciclo Tours</strong>, una propuesta que combina todo lo que amo del cicloturismo grupal, pero llevada a una escala más íntima. Es una invitación a vivir un fin de semana completo con todo resuelto: alojamiento, comidas, circuitos guiados y actividades, ideal para venir en familia, con amigos (bikers o no) o incluso solo/a.</p><p style="text-align: justify;">No hace falta experiencia, solo ganas de disfrutar. Mi misión es que te desconectes del ruido cotidiano y te reconectes con la naturaleza, con la bici y con vos mismo/a.</p><p style="text-align: justify;"><strong>Cupos limitados. Experiencia única. Bienvenidos a rodar distinto.</strong></p><p><strong>Contacto:</strong> Brunilda Schubert<br /><strong>Celular:</strong> 3456 530720</p>`,
  imageUrl: "/foxes.jpg",
}

export default function JerseySection() {
  const { eventSettings, isFirebaseAvailable } = useFirebaseContext()
  const [jerseyData, setJerseyData] = useState(defaultJerseyData)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchJerseyData = async () => {
      if (!isFirebaseAvailable) {
        setLoading(false)
        return
      }

      try {
        const jerseyDoc = doc(db, "content", "jersey")
        const docSnap = await getDoc(jerseyDoc)

        if (docSnap.exists() && docSnap.data().year === (eventSettings?.currentYear || new Date().getFullYear())) {
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
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
            {jerseyData.title}
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 mx-auto mb-4"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="relative aspect-square max-w-md mx-auto">
            <Image
              src={jerseyData.imageUrl || "/pedalpower.jpg"}
              alt="Nuestra Historia"
              width={400}
              height={400}
              className="object-contain"
              priority
            />
          </div>

          <div className="space-y-4 prose max-w-none" dangerouslySetInnerHTML={{ __html: jerseyData.description }} />
        </div>
      </div>

      {/* Sección Foxes */}
      <div>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
            {foxesData.title}
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 mx-auto mb-4"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="relative aspect-square max-w-md mx-auto order-1 md:order-none">
            <Image
              src={foxesData.imageUrl || "/foxes.jpg"}
              alt="Foxes Bikes"
              width={400}
              height={400}
              className="object-contain"
              priority
            />
          </div>

          <div className="space-y-4 prose max-w-none" dangerouslySetInnerHTML={{ __html: foxesData.description }} />
        </div>
      </div>
    </div>
  )
}
