"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { db } from "@/lib/firebase/firebase-config"
import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs, query, where, orderBy } from "firebase/firestore"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"
import { Trash2, Plus, ArrowUp, ArrowDown, Loader2, LinkIcon, Award, ExternalLink, Cloud } from "lucide-react"

export default function SponsorsEditor() {
  const { toast } = useToast()
  const { eventSettings } = useFirebaseContext()
  const [sponsors, setSponsors] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState({})

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        const sponsorsRef = collection(db, "sponsors")

        let sponsorsQuery
        try {
          sponsorsQuery = query(
            sponsorsRef,
            where("year", "==", eventSettings?.currentYear || new Date().getFullYear()),
            orderBy("order", "asc"),
          )
        } catch (error) {
          console.log("Usando query sin orderBy debido a falta de índice")
          sponsorsQuery = query(
            sponsorsRef,
            where("year", "==", eventSettings?.currentYear || new Date().getFullYear()),
          )
        }

        const snapshot = await getDocs(sponsorsQuery)

        let sponsorsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        sponsorsData = sponsorsData.sort((a, b) => (a.order || 0) - (b.order || 0))
        setSponsors(sponsorsData)
      } catch (error) {
        console.error("Error fetching sponsors:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los sponsors.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSponsors()
  }, [eventSettings, toast])

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
      },
    ])
  }

  const handleRemoveSponsor = async (index, sponsor) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este sponsor?")) {
      return
    }

    try {
      if (!sponsor.isNew && sponsor.id) {
        await deleteDoc(doc(db, "sponsors", sponsor.id))
      }

      const newSponsors = [...sponsors]
      newSponsors.splice(index, 1)

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

    const temp = newSponsors[index]
    newSponsors[index] = newSponsors[newIndex]
    newSponsors[newIndex] = temp

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

  const uploadToVercelBlob = async (file, sponsorIndex) => {
    setUploadingFiles((prev) => ({ ...prev, [sponsorIndex]: true }))

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "sponsors")

      console.log("Subiendo archivo:", file.name)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const responseText = await response.text()
      console.log("Respuesta del servidor:", responseText)

      if (!response.ok) {
        let errorData
        try {
          errorData = JSON.parse(responseText)
        } catch {
          errorData = { error: `Error del servidor: ${response.status}` }
        }
        throw new Error(errorData.error || "Error al subir el archivo")
      }

      const data = JSON.parse(responseText)
      console.log("Archivo subido exitosamente:", data)

      return data.filePath
    } catch (error) {
      console.error("Error uploading file:", error)
      throw error
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [sponsorIndex]: false }))
    }
  }

  const handleFileChange = async (index, e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo de imagen válido",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "El archivo es demasiado grande. Máximo 5MB",
        variant: "destructive",
      })
      return
    }

    try {
      // Subir archivo
      const fileUrl = await uploadToVercelBlob(file, index)

      // Actualizar el sponsor con la nueva URL
      const newSponsors = [...sponsors]
      newSponsors[index] = {
        ...newSponsors[index],
        logoUrl: fileUrl,
      }
      setSponsors(newSponsors)

      toast({
        title: "Imagen subida",
        description: "La imagen se ha subido correctamente",
      })
    } catch (error) {
      console.error("Error en handleFileChange:", error)
      toast({
        title: "Error",
        description: `No se pudo subir la imagen: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  const saveChanges = async () => {
    setSaving(true)
    console.log("Iniciando guardado de sponsors...")

    try {
      for (let i = 0; i < sponsors.length; i++) {
        const sponsor = sponsors[i]
        console.log(`Procesando sponsor ${i + 1}:`, sponsor.name)

        if (!sponsor.name || sponsor.name.trim() === "") {
          toast({
            title: "Error",
            description: "Todos los sponsors deben tener un nombre",
            variant: "destructive",
          })
          setSaving(false)
          return
        }

        const sponsorData = {
          name: sponsor.name.trim(),
          logoUrl: sponsor.logoUrl || "/placeholder.svg?height=100&width=200",
          url: sponsor.url || "",
          order: sponsor.order,
          year: eventSettings?.currentYear || new Date().getFullYear(),
          updatedAt: new Date().toISOString(),
        }

        if (sponsor.isNew) {
          const docRef = await addDoc(collection(db, "sponsors"), sponsorData)
          console.log("Sponsor agregado con ID:", docRef.id)
        } else {
          await updateDoc(doc(db, "sponsors", sponsor.id), sponsorData)
          console.log("Sponsor actualizado")
        }
      }

      toast({
        title: "Cambios guardados",
        description: "Los sponsors han sido actualizados correctamente",
      })

      // Refresh sponsors
      const sponsorsRef = collection(db, "sponsors")
      let sponsorsQuery
      try {
        sponsorsQuery = query(
          sponsorsRef,
          where("year", "==", eventSettings?.currentYear || new Date().getFullYear()),
          orderBy("order", "asc"),
        )
      } catch (error) {
        sponsorsQuery = query(sponsorsRef, where("year", "==", eventSettings?.currentYear || new Date().getFullYear()))
      }

      const snapshot = await getDocs(sponsorsQuery)
      let sponsorsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      sponsorsData = sponsorsData.sort((a, b) => (a.order || 0) - (b.order || 0))
      setSponsors(sponsorsData)
    } catch (error) {
      console.error("Error saving sponsors:", error)
      toast({
        title: "Error",
        description: `No se pudieron guardar los cambios: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando sponsors...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
        <div className="flex items-start gap-3">
          <Cloud className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-800">Almacenamiento Local</h3>
            <p className="text-sm text-blue-700 mt-1">
              Las imágenes se guardan en el servidor local en la carpeta public/sponsors
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium">Gestión de Sponsors</h3>
          <p className="text-sm text-muted-foreground">
            Administra los sponsors del evento {eventSettings?.currentYear || new Date().getFullYear()}
          </p>
        </div>
        <Button onClick={handleAddSponsor} className="flex items-center gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Agregar sponsor
        </Button>
      </div>

      {sponsors.length === 0 ? (
        <div className="text-center py-12 bg-muted/50 rounded-lg border-2 border-dashed">
          <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No hay sponsors configurados</p>
          <Button onClick={handleAddSponsor} variant="outline">
            Agregar primer sponsor
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sponsors.map((sponsor, index) => (
            <div key={sponsor.id} className="border rounded-lg p-4 bg-card">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Sponsor {index + 1}
                </h4>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveSponsor(index, "up")}
                    disabled={index === 0}
                    title="Mover arriba"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveSponsor(index, "down")}
                    disabled={index === sponsors.length - 1}
                    title="Mover abajo"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSponsor(index, sponsor)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    title="Eliminar sponsor"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="relative h-32 w-full bg-white rounded-lg border-2 border-dashed border-muted-foreground/25 p-4 flex items-center justify-center">
                    {uploadingFiles[index] ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        <p className="text-sm text-muted-foreground">Subiendo imagen...</p>
                      </div>
                    ) : (
                      <div className="relative w-full h-full">
                        <Image
                          src={sponsor.logoUrl || "/placeholder.svg?height=100&width=200"}
                          alt={sponsor.name || "Logo preview"}
                          fill
                          className="object-contain"
                          onError={(e) => {
                            console.error("Error cargando imagen:", sponsor.logoUrl)
                            e.currentTarget.src = "/placeholder.svg?height=100&width=200"
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`logo-file-${index}`} className="flex items-center gap-2">
                        <Cloud className="h-4 w-4" />
                        Subir imagen
                      </Label>
                      <Input
                        id={`logo-file-${index}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(index, e)}
                        className="cursor-pointer"
                        disabled={uploadingFiles[index]}
                      />
                      <p className="text-xs text-muted-foreground">Se guardará en el servidor local</p>
                    </div>

                    <div className="text-center text-sm text-muted-foreground">
                      <span>- O -</span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`logo-url-${index}`} className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        URL de imagen externa
                      </Label>
                      <Input
                        id={`logo-url-${index}`}
                        type="url"
                        value={sponsor.logoUrl || ""}
                        onChange={(e) => handleInputChange(index, "logoUrl", e.target.value)}
                        placeholder="https://ejemplo.com/logo.png"
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`name-${index}`}>Nombre del sponsor *</Label>
                    <Input
                      id={`name-${index}`}
                      value={sponsor.name || ""}
                      onChange={(e) => handleInputChange(index, "name", e.target.value)}
                      placeholder="Nombre del sponsor"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`url-${index}`} className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4" />
                      Sitio web (opcional)
                    </Label>
                    <Input
                      id={`url-${index}`}
                      value={sponsor.url || ""}
                      onChange={(e) => handleInputChange(index, "url", e.target.value)}
                      placeholder="https://ejemplo.com"
                      type="url"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={saveChanges} disabled={saving || sponsors.length === 0} className="w-full sm:w-auto">
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
