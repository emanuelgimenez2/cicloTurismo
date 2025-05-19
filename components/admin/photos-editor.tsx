"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { db } from "@/lib/firebase/firebase-config"
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  setDoc,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"
import { Trash2, Plus, ArrowUp, ArrowDown, Loader2, Upload } from "lucide-react"

export default function PhotosEditor() {
  const { toast } = useToast()
  const { eventSettings } = useFirebaseContext()
  const [photos, setPhotos] = useState([])
  const [years, setYears] = useState([])
  const [selectedYear, setSelectedYear] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [multipleFiles, setMultipleFiles] = useState([])

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const yearsRef = collection(db, "eventYears")
        const snapshot = await getDocs(yearsRef)
        const yearsData = snapshot.docs.map((doc) => doc.data().year)
        setYears(yearsData.sort((a, b) => b - a)) // Sort years in descending order

        // Set default selected year to current event year
        const currentYear = eventSettings?.currentYear || new Date().getFullYear()
        setSelectedYear(currentYear.toString())

        // If the current year doesn't exist in the years collection, add it
        if (!yearsData.includes(currentYear)) {
          await setDoc(doc(db, "eventYears", currentYear.toString()), {
            year: currentYear,
            edition: `Edición ${currentYear}`,
          })
          setYears([...yearsData, currentYear].sort((a, b) => b - a))
        }
      } catch (error) {
        console.error("Error fetching years:", error)
      }
    }

    fetchYears()
  }, [eventSettings])

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

  const handleAddPhoto = () => {
    setPhotos([
      ...photos,
      {
        id: `temp-${Date.now()}`,
        url: "/placeholder.svg?height=300&width=300",
        description: "",
        order: photos.length,
        year: selectedYear,
        isNew: true,
        file: null,
      },
    ])
  }

  const handleRemovePhoto = async (index, photo) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta foto?")) {
      return
    }

    try {
      if (!photo.isNew && photo.id) {
        // Delete from Firestore
        await deleteDoc(doc(db, "photos", photo.id))

        // Delete photo from Storage if it's not a placeholder
        if (photo.url && !photo.url.includes("placeholder.svg")) {
          const photoRef = ref(storage, photo.url)
          await deleteObject(photoRef).catch((err) => console.log("Image might not exist:", err))
        }
      }

      const newPhotos = [...photos]
      newPhotos.splice(index, 1)

      // Update order for remaining photos
      const updatedPhotos = newPhotos.map((p, i) => ({
        ...p,
        order: i,
      }))

      setPhotos(updatedPhotos)

      toast({
        title: "Foto eliminada",
        description: "La foto ha sido eliminada correctamente",
      })
    } catch (error) {
      console.error("Error removing photo:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la foto",
        variant: "destructive",
      })
    }
  }

  const handleMovePhoto = (index, direction) => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === photos.length - 1)) {
      return
    }

    const newPhotos = [...photos]
    const newIndex = direction === "up" ? index - 1 : index + 1

    // Swap photos
    const temp = newPhotos[index]
    newPhotos[index] = newPhotos[newIndex]
    newPhotos[newIndex] = temp

    // Update order
    const updatedPhotos = newPhotos.map((photo, i) => ({
      ...photo,
      order: i,
    }))

    setPhotos(updatedPhotos)
  }

  const handleInputChange = (index, field, value) => {
    const newPhotos = [...photos]
    newPhotos[index] = {
      ...newPhotos[index],
      [field]: value,
    }
    setPhotos(newPhotos)
  }

  const handleFileChange = (index, e) => {
    const file = e.target.files[0]
    if (!file) return

    const newPhotos = [...photos]
    newPhotos[index] = {
      ...newPhotos[index],
      file,
      // Create a temporary URL for preview
      url: URL.createObjectURL(file),
    }
    setPhotos(newPhotos)
  }

  const handleMultipleFilesChange = (e) => {
    const files = Array.from(e.target.files)
    setMultipleFiles(files)
  }

  const uploadMultiplePhotos = async () => {
    if (multipleFiles.length === 0) {
      toast({
        title: "No hay archivos",
        description: "Por favor selecciona archivos para subir",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      const newPhotos = []
      let order = photos.length

      for (const file of multipleFiles) {
        // Upload to Storage
        const storageRef = ref(storage, `photos/${selectedYear}/${Date.now()}_${file.name}`)
        await uploadBytes(storageRef, file)
        const url = await getDownloadURL(storageRef)

        // Add to Firestore
        const photoData = {
          url,
          description: "",
          order: order++,
          year: selectedYear,
        }

        const docRef = await addDoc(collection(db, "photos"), photoData)
        newPhotos.push({
          id: docRef.id,
          ...photoData,
        })
      }

      // Update state
      setPhotos([...photos, ...newPhotos])
      setMultipleFiles([])

      toast({
        title: "Fotos subidas",
        description: `Se han subido ${multipleFiles.length} fotos correctamente`,
      })
    } catch (error) {
      console.error("Error uploading multiple photos:", error)
      toast({
        title: "Error",
        description: "No se pudieron subir las fotos",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const saveChanges = async () => {
    setSaving(true)
    try {
      for (const photo of photos) {
        // If there's a new file, upload it first
        let url = photo.url
        if (photo.file) {
          const storageRef = ref(storage, `photos/${selectedYear}/${Date.now()}_${photo.file.name}`)
          await uploadBytes(storageRef, photo.file)
          url = await getDownloadURL(storageRef)
        }

        const photoData = {
          url,
          description: photo.description || "",
          order: photo.order,
          year: selectedYear,
        }

        if (photo.isNew) {
          // Add new photo
          await addDoc(collection(db, "photos"), photoData)
        } else {
          // Update existing photo
          await updateDoc(doc(db, "photos", photo.id), photoData)
        }
      }

      toast({
        title: "Cambios guardados",
        description: "Las fotos han sido actualizadas correctamente",
      })

      // Refresh photos
      const photosRef = collection(db, "photos")
      const q = query(photosRef, where("year", "==", selectedYear), orderBy("order", "asc"))
      const snapshot = await getDocs(q)
      const photosData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setPhotos(photosData)
    } catch (error) {
      console.error("Error saving photos:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading && !selectedYear) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2 w-full md:w-auto">
          <Label htmlFor="year-select">Seleccionar año</Label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Seleccionar año" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <Button onClick={handleAddPhoto} className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            Agregar foto
          </Button>
        </div>
      </div>

      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="font-medium">Subida múltiple de fotos</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="multiple-photos">Seleccionar múltiples fotos</Label>
            <Input
              id="multiple-photos"
              type="file"
              accept="image/*"
              multiple
              onChange={handleMultipleFilesChange}
              disabled={uploading}
            />
            <p className="text-xs text-muted-foreground">
              Puedes seleccionar múltiples archivos para subirlos de una vez
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={uploadMultiplePhotos} disabled={uploading || multipleFiles.length === 0}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Subir {multipleFiles.length} foto{multipleFiles.length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
            {multipleFiles.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {multipleFiles.length} archivo{multipleFiles.length !== 1 ? "s" : ""} seleccionado
                {multipleFiles.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-8 bg-muted rounded-lg">
          <p className="text-muted-foreground">No hay fotos para este año</p>
          <Button onClick={handleAddPhoto} variant="outline" className="mt-4">
            Agregar primera foto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo, index) => (
            <div key={photo.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Foto {index + 1}</h4>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMovePhoto(index, "up")}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMovePhoto(index, "down")}
                    disabled={index === photos.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemovePhoto(index, photo)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative aspect-square overflow-hidden rounded-md mb-2 border">
                  <Image
                    src={photo.url || "/placeholder.svg?height=300&width=300"}
                    alt={photo.description || "Foto del evento"}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`photo-${index}`}>Cambiar imagen</Label>
                  <Input
                    id={`photo-${index}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(index, e)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`description-${index}`}>Descripción (opcional)</Label>
                  <Textarea
                    id={`description-${index}`}
                    value={photo.description || ""}
                    onChange={(e) => handleInputChange(index, "description", e.target.value)}
                    placeholder="Descripción de la foto"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {photos.length > 0 && (
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
      )}
    </div>
  )
}
