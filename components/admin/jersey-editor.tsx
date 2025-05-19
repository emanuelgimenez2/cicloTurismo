"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { db } from "@/lib/firebase/firebase-config"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"
import { Loader2 } from "lucide-react"

export default function JerseyEditor() {
  const { toast } = useToast()
  const { eventSettings } = useFirebaseContext()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [jerseyData, setJerseyData] = useState({
    title: "Remera Oficial del Evento",
    description: "<p>Diseño exclusivo para la Segunda Edición del Cicloturismo Termal de Federación.</p>",
    imageUrl: "/placeholder.svg?height=600&width=600",
    year: new Date().getFullYear(),
  })
  const [file, setFile] = useState(null)

  useEffect(() => {
    const fetchJerseyData = async () => {
      try {
        const jerseyDoc = doc(db, "content", "jersey")
        const docSnap = await getDoc(jerseyDoc)

        if (docSnap.exists() && docSnap.data().year === (eventSettings?.currentYear || new Date().getFullYear())) {
          setJerseyData(docSnap.data())
        } else {
          // Set default data with current year
          setJerseyData({
            ...jerseyData,
            year: eventSettings?.currentYear || new Date().getFullYear(),
          })
        }
      } catch (error) {
        console.error("Error fetching jersey data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchJerseyData()
  }, [eventSettings])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setJerseyData({
      ...jerseyData,
      [name]: value,
    })
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      // Create a temporary URL for preview
      setJerseyData({
        ...jerseyData,
        imageUrl: URL.createObjectURL(selectedFile),
      })
    }
  }

  const saveChanges = async () => {
    setSaving(true)
    try {
      let imageUrl = jerseyData.imageUrl

      // If there's a new file, upload it first
      if (file) {
        const storageRef = ref(storage, `jersey/${Date.now()}_${file.name}`)
        await uploadBytes(storageRef, file)
        imageUrl = await getDownloadURL(storageRef)
      }

      // Save to Firestore
      await setDoc(doc(db, "content", "jersey"), {
        ...jerseyData,
        imageUrl,
        year: eventSettings?.currentYear || new Date().getFullYear(),
      })

      toast({
        title: "Cambios guardados",
        description: "La información de la remera ha sido actualizada correctamente",
      })

      // Reset file state
      setFile(null)
    } catch (error) {
      console.error("Error saving jersey data:", error)
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
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" value={jerseyData.title} onChange={handleInputChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (HTML permitido)</Label>
            <Textarea
              id="description"
              name="description"
              value={jerseyData.description}
              onChange={handleInputChange}
              rows={10}
            />
            <p className="text-xs text-muted-foreground">
              Puedes usar etiquetas HTML como &lt;p&gt;, &lt;strong&gt;, &lt;ul&gt;, etc.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-md mb-2 border">
            <Image
              src={jerseyData.imageUrl || "/placeholder.svg?height=600&width=600"}
              alt="Remera oficial"
              fill
              className="object-contain"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jersey-image">Imagen de la remera</Label>
            <Input id="jersey-image" type="file" accept="image/*" onChange={handleFileChange} />
          </div>
        </div>
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
