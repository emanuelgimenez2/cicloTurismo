"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { db, storage } from "@/lib/firebase/firebase-config"
import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs, query, where, orderBy } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"
import { Trash2, Plus, ArrowUp, ArrowDown, Loader2, LinkIcon } from "lucide-react"

export default function SponsorsEditor() {
  const { toast } = useToast()
  const { eventSettings } = useFirebaseContext()
  const [sponsors, setSponsors] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchSponsors = async () => {
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

        setSponsors(sponsorsData)
      } catch (error) {
        console.error("Error fetching sponsors:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSponsors()
  }, [eventSettings])

  const handleAddSponsor = () => {
    setSponsors([
      ...sponsors,
      {
        id: `temp-${Date.now()}`,
        name: "Nuevo sponsor",
        logoUrl: "/placeholder.svg?height=100&width=200",
        url: "https://",
        order: sponsors.length,
        year: eventSettings?.currentYear || new Date().getFullYear(),
        isNew: true,
        file: null,
      },
    ])
  }

  const handleRemoveSponsor = async (index, sponsor) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este sponsor?")) {
      return
    }

    try {
      if (!sponsor.isNew && sponsor.id) {
        // Delete from Firestore
        await deleteDoc(doc(db, "sponsors", sponsor.id))

        // Delete logo from Storage if it's not a placeholder
        if (sponsor.logoUrl && !sponsor.logoUrl.includes("placeholder.svg")) {
          const logoRef = ref(storage, sponsor.logoUrl)
          await deleteObject(logoRef).catch((err) => console.log("Image might not exist:", err))
        }
      }

      const newSponsors = [...sponsors]
      newSponsors.splice(index, 1)

      // Update order for remaining sponsors
      const updatedSponsors = newSponsors.map((s, i) => ({
        ...s,
        order: i,
      }))

      setSponsors(updatedSponsors)

      toast({
        title: "Sponsor eliminado",
        description: "El sponsor ha sido eliminado correctamente",
      })
    } catch (error) {
      console.error("Error removing sponsor:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el sponsor",
        variant: "destructive",
      })
    }
  }

  const handleMoveSponsor = (index, direction) => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === sponsors.length - 1)) {
      return
    }

    const newSponsors = [...sponsors]
    const newIndex = direction === "up" ? index - 1 : index + 1

    // Swap sponsors
    const temp = newSponsors[index]
    newSponsors[index] = newSponsors[newIndex]
    newSponsors[newIndex] = temp

    // Update order
    const updatedSponsors = newSponsors.map((sponsor, i) => ({
      ...sponsor,
      order: i,
    }))

    setSponsors(updatedSponsors)
  }

  const handleInputChange = (index, field, value) => {
    const newSponsors = [...sponsors]
    newSponsors[index] = {
      ...newSponsors[index],
      [field]: value,
    }
    setSponsors(newSponsors)
  }

  const handleFileChange = (index, e) => {
    const file = e.target.files[0]
    if (!file) return

    const newSponsors = [...sponsors]
    newSponsors[index] = {
      ...newSponsors[index],
      file,
      // Create a temporary URL for preview
      logoUrl: URL.createObjectURL(file),
    }
    setSponsors(newSponsors)
  }

  const saveChanges = async () => {
    setSaving(true)
    try {
      for (const sponsor of sponsors) {
        // If there's a new file, upload it first
        let logoUrl = sponsor.logoUrl
        if (sponsor.file) {
          const storageRef = ref(storage, `sponsors/${Date.now()}_${sponsor.file.name}`)
          await uploadBytes(storageRef, sponsor.file)
          logoUrl = await getDownloadURL(storageRef)
        }

        const sponsorData = {
          name: sponsor.name,
          logoUrl,
          url: sponsor.url,
          order: sponsor.order,
          year: eventSettings?.currentYear || new Date().getFullYear(),
        }

        if (sponsor.isNew) {
          // Add new sponsor
          await addDoc(collection(db, "sponsors"), sponsorData)
        } else {
          // Update existing sponsor
          await updateDoc(doc(db, "sponsors", sponsor.id), sponsorData)
        }
      }

      toast({
        title: "Cambios guardados",
        description: "Los sponsors han sido actualizados correctamente",
      })

      // Refresh sponsors
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

      setSponsors(sponsorsData)
    } catch (error) {
      console.error("Error saving sponsors:", error)
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
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Sponsors</h3>
        <Button onClick={handleAddSponsor} className="flex items-center gap-1">
          <Plus className="h-4 w-4" />
          Agregar sponsor
        </Button>
      </div>

      {sponsors.length === 0 ? (
        <div className="text-center py-8 bg-muted rounded-lg">
          <p className="text-muted-foreground">No hay sponsors configurados</p>
          <Button onClick={handleAddSponsor} variant="outline" className="mt-4">
            Agregar primer sponsor
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {sponsors.map((sponsor, index) => (
            <div key={sponsor.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Sponsor {index + 1}</h4>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveSponsor(index, "up")}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveSponsor(index, "down")}
                    disabled={index === sponsors.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSponsor(index, sponsor)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="relative h-24 w-full mb-2 bg-white rounded-lg p-2 flex items-center justify-center border">
                    <Image
                      src={sponsor.logoUrl || "/placeholder.svg?height=100&width=200"}
                      alt={sponsor.name || "Logo preview"}
                      width={150}
                      height={80}
                      className="object-contain max-h-20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`logo-${index}`}>Logo</Label>
                    <Input
                      id={`logo-${index}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(index, e)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`name-${index}`}>Nombre</Label>
                    <Input
                      id={`name-${index}`}
                      value={sponsor.name || ""}
                      onChange={(e) => handleInputChange(index, "name", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`url-${index}`} className="flex items-center gap-1">
                      <LinkIcon className="h-4 w-4" />
                      URL (sitio web)
                    </Label>
                    <Input
                      id={`url-${index}`}
                      value={sponsor.url || ""}
                      onChange={(e) => handleInputChange(index, "url", e.target.value)}
                      placeholder="https://"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
