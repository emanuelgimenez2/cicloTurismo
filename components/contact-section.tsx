"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { MapPin, Phone, Mail, Facebook, Instagram, Twitter } from "lucide-react"
import { db } from "@/lib/firebase/firebase-config"
import { doc, getDoc } from "firebase/firestore"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"

// Datos predeterminados para cuando Firebase no está disponible
const defaultContactData = {
  phone: "+54 9 11 1234-5678",
  email: "contacto@cicloturismotermal.com",
  address: "Federación, Entre Ríos, Argentina",
  facebook: "https://facebook.com",
  instagram: "https://instagram.com",
  twitter: "https://twitter.com",
  mapUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d27326.25265830704!2d-57.94760566738281!3d-30.979729799999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95ae33e020a08b21%3A0x6a86cd05ca4d1ac9!2sFederaci%C3%B3n%2C%20Entre%20R%C3%ADos!5e0!3m2!1ses-419!2sar!4v1652364807261!5m2!1ses-419!2sar",
  showMap: true,
}

export default function ContactSection() {
  const { eventSettings, isFirebaseAvailable } = useFirebaseContext()
  const [contactData, setContactData] = useState(defaultContactData)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchContactData = async () => {
      if (!isFirebaseAvailable) {
        setContactData(defaultContactData)
        setLoading(false)
        return
      }

      try {
        const contactDoc = doc(db, "content", "contact")
        const docSnap = await getDoc(contactDoc)

        if (docSnap.exists()) {
          setContactData({
            ...contactData,
            ...docSnap.data(),
          })
        }
      } catch (error) {
        console.error("Error fetching contact data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchContactData()
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
          Contacto
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 mx-auto mb-4"></div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">¿Tenés alguna pregunta? Contactanos</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        <div className="space-y-6">
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-pink-500 mt-1" />
            <div>
              <h3 className="font-medium">Dirección</h3>
              <p className="text-gray-600">{contactData.address}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Phone className="h-5 w-5 text-violet-500 mt-1" />
            <div>
              <h3 className="font-medium">Teléfono</h3>
              <p className="text-gray-600">
                <Link href={`tel:${contactData.phone.replace(/\D/g, "")}`} className="hover:text-violet-500">
                  {contactData.phone}
                </Link>
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Mail className="h-5 w-5 text-blue-500 mt-1" />
            <div>
              <h3 className="font-medium">Email</h3>
              <p className="text-gray-600">
                <Link href={`mailto:${contactData.email}`} className="hover:text-blue-500">
                  {contactData.email}
                </Link>
              </p>
            </div>
          </div>

          <div className="pt-4">
            <h3 className="font-medium mb-3">Redes Sociales</h3>
            <div className="flex space-x-4">
              <Link href={contactData.facebook} target="_blank" className="text-gray-600 hover:text-pink-500">
                <Facebook className="h-6 w-6" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href={contactData.instagram} target="_blank" className="text-gray-600 hover:text-violet-500">
                <Instagram className="h-6 w-6" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href={contactData.twitter} target="_blank" className="text-gray-600 hover:text-blue-500">
                <Twitter className="h-6 w-6" />
                <span className="sr-only">Twitter</span>
              </Link>
            </div>
          </div>
        </div>

        {contactData.showMap && (
          <div className="h-80 rounded-lg overflow-hidden shadow-sm">
            <iframe
              src={contactData.mapUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Mapa de ubicación"
            ></iframe>
          </div>
        )}
      </div>
    </div>
  )
}
