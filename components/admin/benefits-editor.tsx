"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { db } from "@/lib/firebase/firebase-config"
import { collection, doc, deleteDoc, getDocs, query, where, orderBy, writeBatch } from "firebase/firestore"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"
import { Trash2, Plus, ArrowUp, ArrowDown, Loader2 } from "lucide-react"

export default function BenefitsEditor() {
  const { toast } = useToast()
  const { eventSettings } = useFirebaseContext()
  const [benefits, setBenefits] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchBenefits = async () => {
      try {
        const benefitsRef = collection(db, "benefits")
        const currentYearBenefits = query(
          benefitsRef,
          where("year", "==", eventSettings?.currentYear || new Date().getFullYear()),
          orderBy("order", "asc"),
        )
        const snapshot = await getDocs(currentYearBenefits)

        const benefitsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        setBenefits(
          benefitsData.length > 0
            ? benefitsData
            : [
                { id: "temp-1", text: "Jersey oficial del evento", order: 0, isNew: true },
                { id: "temp-2", text: "Buff y bolsita kit", order: 1, isNew: true },
                { id: "temp-3", text: "Desayuno antes de la partida", order: 2, isNew: true },
                { id: "temp-4", text: "Frutas y agua en paradas", order: 3, isNew: true },
                { id: "temp-5", text: "Seguro de accidentes", order: 4, isNew: true },
                { id: "temp-6", text: "Asistencia médica", order: 5, isNew: true },
                { id: "temp-7", text: "Asistencia técnica", order: 6, isNew: true },
                { id: "temp-8", text: "Vehículo de apoyo", order: 7, isNew: true },
              ],
        )
      } catch (error) {
        console.error("Error fetching benefits:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBenefits()
  }, [eventSettings])

  const handleAddBenefit = () => {
    setBenefits([
      ...benefits,
      {
        id: `temp-${Date.now()}`,
        text: "Nuevo beneficio",
        order: benefits.length,
        year: eventSettings?.currentYear || new Date().getFullYear(),
        isNew: true,
      },
    ])
  }

  const handleRemoveBenefit = async (index, benefit) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este beneficio?")) {
      return
    }

    try {
      if (!benefit.isNew && benefit.id) {
        // Delete from Firestore
        await deleteDoc(doc(db, "benefits", benefit.id))
      }

      const newBenefits = [...benefits]
      newBenefits.splice(index, 1)

      // Update order for remaining benefits
      const updatedBenefits = newBenefits.map((b, i) => ({
        ...b,
        order: i,
      }))

      setBenefits(updatedBenefits)

      toast({
        title: "Beneficio eliminado",
        description: "El beneficio ha sido eliminado correctamente",
      })
    } catch (error) {
      console.error("Error removing benefit:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el beneficio",
        variant: "destructive",
      })
    }
  }

  const handleMoveBenefit = (index, direction) => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === benefits.length - 1)) {
      return
    }

    const newBenefits = [...benefits]
    const newIndex = direction === "up" ? index - 1 : index + 1

    // Swap benefits
    const temp = newBenefits[index]
    newBenefits[index] = newBenefits[newIndex]
    newBenefits[newIndex] = temp

    // Update order
    const updatedBenefits = newBenefits.map((benefit, i) => ({
      ...benefit,
      order: i,
    }))

    setBenefits(updatedBenefits)
  }

  const handleInputChange = (index, value) => {
    const newBenefits = [...benefits]
    newBenefits[index] = {
      ...newBenefits[index],
      text: value,
    }
    setBenefits(newBenefits)
  }

  const saveChanges = async () => {
    setSaving(true)
    try {
      const batch = writeBatch(db)
      const benefitsRef = collection(db, "benefits")

      // First, delete all existing benefits for this year to avoid duplicates
      const currentYearBenefits = query(
        benefitsRef,
        where("year", "==", eventSettings?.currentYear || new Date().getFullYear()),
      )
      const snapshot = await getDocs(currentYearBenefits)
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref)
      })

      // Then add all benefits
      for (const benefit of benefits) {
        const benefitData = {
          text: benefit.text,
          order: benefit.order,
          year: eventSettings?.currentYear || new Date().getFullYear(),
        }

        const newBenefitRef = doc(benefitsRef)
        batch.set(newBenefitRef, benefitData)
      }

      await batch.commit()

      toast({
        title: "Cambios guardados",
        description: "Los beneficios han sido actualizados correctamente",
      })

      // Refresh benefits
      const refreshedBenefits = query(
        benefitsRef,
        where("year", "==", eventSettings?.currentYear || new Date().getFullYear()),
        orderBy("order", "asc"),
      )
      const refreshedSnapshot = await getDocs(refreshedBenefits)

      const benefitsData = refreshedSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setBenefits(benefitsData)
    } catch (error) {
      console.error("Error saving benefits:", error)
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
        <h3 className="text-lg font-medium">Lista de beneficios</h3>
        <Button onClick={handleAddBenefit} className="flex items-center gap-1">
          <Plus className="h-4 w-4" />
          Agregar beneficio
        </Button>
      </div>

      {benefits.length === 0 ? (
        <div className="text-center py-8 bg-muted rounded-lg">
          <p className="text-muted-foreground">No hay beneficios configurados</p>
          <Button onClick={handleAddBenefit} variant="outline" className="mt-4">
            Agregar primer beneficio
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {benefits.map((benefit, index) => (
            <div key={benefit.id} className="flex items-center gap-2 border rounded-lg p-3">
              <div className="flex-1">
                <Input value={benefit.text} onChange={(e) => handleInputChange(index, e.target.value)} />
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleMoveBenefit(index, "up")}
                  disabled={index === 0}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleMoveBenefit(index, "down")}
                  disabled={index === benefits.length - 1}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveBenefit(index, benefit)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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
