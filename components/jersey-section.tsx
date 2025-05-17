"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { db } from "@/lib/firebase/firebase-config"
import { doc, getDoc } from "firebase/firestore"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"

const defaultJerseyData = {
  title: "Pedal Power",
  description: `<p style="text-align: justify;">Somos Pedal Power, un grupo de amigos unidos por una misma pasión: el ciclismo...</p>`,
  imageUrl: "/pedalpower.jpg",
}

const foxesData = {
  title: "Foxes Bikes Ciclo Tours",
  description: `<p style="text-align: justify;">Como integrante de Pedal Power, he compartido caminos, emociones...</p>`,
  imageUrl: "/foxes.jpg",
}

function SectionHeader({ image, title }) {
  return (
    <div className="flex flex-col items-center text-center mb-8">
      <div className="flex items-center gap-4">
        <Image src={image} alt={`Logo ${title}`} width={60} height={60} className="object-contain" priority />
        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
          {title}
        </h2>
      </div>
      <div className="w-24 h-1 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 mt-2" />
    </div>
  )
}

function CollapsibleText({ html, imageHeight = 300, expanded, setExpanded }) {
  const textContainerRef = useRef(null)
  const [shouldTruncate, setShouldTruncate] = useState(false)

  const processHtml = (htmlContent) => {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    const plainText = tempDiv.textContent || tempDiv.innerText

    const linesInImageHeight = Math.floor(imageHeight / 10)
    const charsInImageHeight = linesInImageHeight * 10

    if (plainText.length > charsInImageHeight) {
      let truncatedText = plainText.substring(0, charsInImageHeight)
      if (truncatedText.lastIndexOf(' ') > charsInImageHeight - 10) {
        truncatedText = truncatedText.substring(0, truncatedText.lastIndexOf(' '))
      }
      truncatedText += '...'
      return {
        previewHtml: `<p style="text-align: justify;">${truncatedText}</p>`,
        hasMore: true
      }
    }

    return {
      previewHtml: htmlContent,
      hasMore: false
    }
  }

  const [processedContent, setProcessedContent] = useState({
    previewHtml: html,
    fullHtml: html,
    hasMore: false
  })

  useEffect(() => {
    if (textContainerRef.current) {
      const checkHeight = () => {
        const textHeight = textContainerRef.current.scrollHeight
        if (textHeight > imageHeight) {
          setShouldTruncate(true)
          const { previewHtml, hasMore } = processHtml(html)
          setProcessedContent({
            previewHtml,
            fullHtml: html,
            hasMore
          })
        } else {
          setShouldTruncate(false)
        }
      }

      checkHeight()
      window.addEventListener('resize', checkHeight)
      return () => window.removeEventListener('resize', checkHeight)
    }
  }, [html, imageHeight])

  return (
    <>
      {/* Div oculto para medición */}
      <div
        ref={textContainerRef}
        className="absolute opacity-0 pointer-events-none"
        style={{ width: '90%', maxWidth: '90%' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* Contenido visible */}
      <div
        style={{ textAlign: "justify" }}
        dangerouslySetInnerHTML={{ __html: expanded ? processedContent.fullHtml : processedContent.previewHtml }}
      />
      {shouldTruncate && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-blue-600 font-medium hover:underline focus:outline-none"
        >
          {expanded ? "Ver menos" : "Leer más"}
        </button>
      )}
    </>
  )
}

export default function JerseySection() {
  const { eventSettings, isFirebaseAvailable } = useFirebaseContext()
  const [jerseyData, setJerseyData] = useState(defaultJerseyData)
  const [loading, setLoading] = useState(true)
  const [expandedJersey, setExpandedJersey] = useState(false)
  const [expandedFoxes, setExpandedFoxes] = useState(false)
  const IMAGE_HEIGHT = 250

  useEffect(() => {
    const fetchJerseyData = async () => {
      if (!isFirebaseAvailable) {
        setLoading(false)
        return
      }

      try {
        const jerseyDoc = doc(db, "content", "#historia")
        const docSnap = await getDoc(jerseyDoc)
        if (
          docSnap.exists() &&
          docSnap.data().year === (eventSettings?.currentYear || new Date().getFullYear())
        ) {
          setJerseyData(docSnap.data())
        }
      } catch (error) {
        console.error("Error al obtener los datos de historia:", error)
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
        <div className={`flex flex-col items-center gap-8`}>
          <div className="relative w-[300px] h-[300px]">
            <Image
              src={jerseyData.imageUrl || "/pedalpower.jpg"}
              alt="Nuestra Historia"
              fill
              className="object-cover rounded-3xl shadow-2xl"
              priority
            />
          </div>
          <div className="w-full md:max-w-3xl">
            <CollapsibleText
              html={jerseyData.description}
              imageHeight={IMAGE_HEIGHT}
              expanded={expandedJersey}
              setExpanded={setExpandedJersey}
            />
          </div>
        </div>
      </div>

      {/* Sección Foxes Bikes */}
      <div>
        <SectionHeader image="/foxeslogo.png" title={foxesData.title} />
        <div className={`flex flex-col items-center gap-8`}>
          <div className="relative w-[300px] h-[300px]">
            <Image
              src={foxesData.imageUrl || "/foxes.jpg"}
              alt="Foxes Bikes"
              fill
              className="object-cover rounded-3xl shadow-2xl"
              priority
            />
          </div>
          <div className="w-full md:max-w-3xl">
            <CollapsibleText
              html={foxesData.description}
              imageHeight={IMAGE_HEIGHT}
              expanded={expandedFoxes}
              setExpanded={setExpandedFoxes}
            />
          </div>
        </div>
      </div>

    </div>
  )
}
