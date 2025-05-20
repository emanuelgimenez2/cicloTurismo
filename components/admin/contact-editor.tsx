"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { db } from "@/lib/firebase/firebase-config"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { Loader2, MapPin, Phone, Mail, Facebook, Instagram, Twitter } from "lucide-react"

export default function ContactEditor() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [contactData, setContactData] = useState({
    phone: "+54 9 3456530720",
    email: "contacto@cicloturismotermal.com",
    address: "Federación, Entre Ríos, Argentina",
    facebook: "https://facebook.com",
    instagram: "https://instagram.com",
    twitter: "https://twitter.com",
    mapUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d27326.25265830704!2d-57.94760566738281!3d-30.979729799999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95ae33e020a08b21%3A0x6a86cd05ca4d1ac9!2sFederaci%C3%B3n%2C%20Entre%20R%C3%ADos!5e0!3m2!1ses-419!2sar!4v1652364807261!5m2!1ses-419!2sar",
    showMap: true,
  })

  useEffect(() => {
    const fetchContactData = async () => {
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
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setContactData({
      ...contactData,
      [name]: value,
    })
  }

  const handleSwitchChange = (checked) => {
    setContactData({
      ...contactData,
      showMap: checked,
    })
  }

  const saveChanges = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, "content", "contact"), contactData)

      toast({
        title: "Cambios guardados",
        description: "La información de contacto ha sido actualizada correctamente",
      })
    } catch (error) {
      console.error("Error saving contact data:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-pink-500" />
              Dirección
            </Label>
            <Input id="address" name="address" value={contactData.address} onChange={handleInputChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-1">
              <Phone className="h-4 w-4 text-violet-500" />
              Teléfono
            </Label>
            <Input id="phone" name="phone" value={contactData.phone} onChange={handleInputChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-1">
              <Mail className="h-4 w-4 text-blue-500" />
              Email
            </Label>
            <Input id="email" name="email" value={contactData.email} onChange={handleInputChange} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="facebook" className="flex items-center gap-1">
              <Facebook className="h-4 w-4 text-blue-600" />
              Facebook URL
            </Label>
            <Input id="facebook" name="facebook" value={contactData.facebook} onChange={handleInputChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram" className="flex items-center gap-1">
              <Instagram className="h-4 w-4 text-pink-600" />
              Instagram URL
            </Label>
            <Input id="instagram" name="instagram" value={contactData.instagram} onChange={handleInputChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitter" className="flex items-center gap-1">
              <Twitter className="h-4 w-4 text-blue-400" />
              Twitter URL
            </Label>
            <Input id="twitter" name="twitter" value={contactData.twitter} onChange={handleInputChange} />
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t pt-4">
        <div className="flex items-center space-x-2">
          <Switch id="showMap" checked={contactData.showMap} onCheckedChange={handleSwitchChange} />
          <Label htmlFor="showMap">Mostrar mapa</Label>
        </div>

        {contactData.showMap && (
          <div className="space-y-2">
            <Label htmlFor="mapUrl">URL del mapa (iframe de Google Maps)</Label>
            <Textarea id="mapUrl" name="mapUrl" value={contactData.mapUrl} onChange={handleInputChange} rows={4} />
            <p className="text-xs text-muted-foreground">
              Puedes obtener este código desde Google Maps: Compartir &gt; Incorporar un mapa
            </p>

            <div className="mt-4 border rounded-lg overflow-hidden h-60">
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
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={saveChanges} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </div>
    </div>
  )
}
