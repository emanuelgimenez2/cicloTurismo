"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { collection, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase-config"

export default function SimpleRegistration() {
  const [nombre, setNombre] = useState("")
  const [imagen, setImagen] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFileChange = (e) => {
    setImagen(e.target.files[0])
  }

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      console.log("Iniciando envío...") // Debug 1
      
      if (!nombre || !imagen) {
        console.log("Faltan campos requeridos") // Debug 2
        return
      }

      console.log("Convirtiendo imagen...") // Debug 3
      const imagenBase64 = await convertToBase64(imagen)

      console.log("Preparando datos...") // Debug 4
      const datos = {
        nombre: nombre,
        imagen: imagenBase64,
        fecha: new Date().toISOString()
      }

      console.log("Enviando a Firebase...", datos) // Debug 5
      const docRef = await addDoc(collection(db, "participantes2025"), datos)
      
      console.log("Documento escrito con ID: ", docRef.id) // Debug 6
      alert("Inscripción exitosa!")
      
    } catch (error) {
      console.error("Error al enviar:", error) // Debug 7
      alert("Error: " + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Prueba de inscripción</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="nombre">Nombre holaaa *</Label>
          <Input
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="imagen">Imagen *</Label>
          <Input
            id="imagen"
            type="file"
            onChange={handleFileChange}
            required
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Enviando..." : "Enviar"}
        </Button>
      </form>
    </div>
  )
}