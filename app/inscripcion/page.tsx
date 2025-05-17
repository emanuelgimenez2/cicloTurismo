"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { db, fileToBase64 } from "@/lib/firebase/firebase-config"
import { collection, addDoc, getDocs, query, where } from "firebase/firestore"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"
import { AlertCircle, Loader2 } from "lucide-react"

export default function RegistrationPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { eventSettings, isFirebaseAvailable } = useFirebaseContext()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableSpots, setAvailableSpots] = useState(0)
  const [formFields, setFormFields] = useState([])
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    fechaNacimiento: "",
    localidad: "",
    email: "",
    telefono: "",
    genero: "",
    talleRemera: "",
    tieneAlergias: false,
    alergias: "",
    tomaMedicamentos: false,
    medicamentos: "",
    tieneProblemasSalud: false,
    problemasSalud: "",
    aceptaCondiciones: false,
    comprobantePago: null,
  })

  useEffect(() => {
    // Fetch available spots
    const checkAvailableSpots = async () => {
      if (!isFirebaseAvailable) {
        setAvailableSpots(250) // Valor predeterminado para demostración
        return
      }

      try {
        const registrationsRef = collection(db, "registrations")
        const currentYearRegistrations = query(registrationsRef, where("year", "==", new Date().getFullYear()))
        const snapshot = await getDocs(currentYearRegistrations)
        const totalRegistrations = snapshot.size
        const maxSpots = eventSettings?.cupoMaximo || 300
        setAvailableSpots(maxSpots - totalRegistrations)
      } catch (error) {
        console.error("Error checking available spots:", error)
        setAvailableSpots(0)
      }

      // Asegurar que siempre haya cupos disponibles en modo demostración
      if (availableSpots <= 0) {
        setAvailableSpots(50)
      }
    }

    // Fetch custom form fields
    const getCustomFormFields = async () => {
      if (!isFirebaseAvailable) {
        setFormFields([]) // Sin campos personalizados en modo demostración
        return
      }

      try {
        const formFieldsRef = collection(db, "formFields")
        const snapshot = await getDocs(formFieldsRef)
        const fields = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setFormFields(fields)
      } catch (error) {
        console.error("Error fetching custom form fields:", error)
      }
    }

    checkAvailableSpots()
    getCustomFormFields()
  }, [eventSettings, isFirebaseAvailable])

  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? e.target.checked : value,
    })
  }

  const handleCheckboxChange = (name, checked) => {
    setFormData({
      ...formData,
      [name]: checked,
    })
  }

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    setFormData({
      ...formData,
      comprobantePago: file,
    })
  }

  const validateForm = () => {
    // Basic validation
    if (
      !formData.nombre ||
      !formData.apellido ||
      !formData.dni ||
      !formData.fechaNacimiento ||
      !formData.localidad ||
      !formData.email ||
      !formData.telefono ||
      !formData.genero ||
      !formData.talleRemera ||
      !formData.aceptaCondiciones ||
      !formData.comprobantePago
    ) {
      toast({
        title: "Error en el formulario",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive",
      })
      return false
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Email inválido",
        description: "Por favor ingrese un email válido",
        variant: "destructive",
      })
      return false
    }

    // DNI validation
    const dniRegex = /^\d{7,8}$/
    if (!dniRegex.test(formData.dni)) {
      toast({
        title: "DNI inválido",
        description: "Por favor ingrese un DNI válido (7-8 dígitos)",
        variant: "destructive",
      })
      return false
    }

    // Phone validation
    const phoneRegex = /^\d{10,15}$/
    if (!phoneRegex.test(formData.telefono.replace(/\D/g, ""))) {
      toast({
        title: "Teléfono inválido",
        description: "Por favor ingrese un número de teléfono válido",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    if (availableSpots <= 0) {
      toast({
        title: "Cupo completo",
        description: "Lo sentimos, ya no hay cupos disponibles para este evento",
        variant: "destructive",
      })
      return
    }

    if (!isFirebaseAvailable) {
      toast({
        title: "Modo demostración",
        description: "Esta es una versión de demostración. Para habilitar la inscripción real, configure Firebase.",
      })
      router.push("/inscripcion/confirmacion")
      return
    }

    setIsSubmitting(true)

    try {
      // Convertir el archivo a base64
      let comprobantePagoBase64 = null
      if (formData.comprobantePago) {
        comprobantePagoBase64 = await fileToBase64(formData.comprobantePago)
      }

      // Prepare health condition information
      const condicionSalud = {
        tieneAlergias: formData.tieneAlergias,
        alergias: formData.alergias,
        tomaMedicamentos: formData.tomaMedicamentos,
        medicamentos: formData.medicamentos,
        tieneProblemasSalud: formData.tieneProblemasSalud,
        problemasSalud: formData.problemasSalud,
      }

      // Save registration data
      const registrationData = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        dni: formData.dni,
        fechaNacimiento: formData.fechaNacimiento,
        localidad: formData.localidad,
        email: formData.email,
        telefono: formData.telefono,
        genero: formData.genero,
        talleRemera: formData.talleRemera,
        condicionSalud: JSON.stringify(condicionSalud),
        comprobantePago: comprobantePagoBase64,
        nombreArchivo: formData.comprobantePago?.name || "comprobante.jpg",
        fechaInscripcion: new Date(),
        year: new Date().getFullYear(),
        edition: "Segunda Edición",
        estado: "pendiente",
      }

      await addDoc(collection(db, "registrations"), registrationData)

      toast({
        title: "Inscripción exitosa",
        description: "Tu inscripción ha sido registrada correctamente",
      })

      router.push("/inscripcion/confirmacion")
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: "Hubo un problema al procesar tu inscripción. Por favor intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto shadow-lg">
          <CardHeader className="bg-gradient-to-r from-pink-100 to-blue-100 rounded-t-lg">
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
              Inscripción - Cicloturismo Termal de Federación
            </CardTitle>
            <CardDescription className="text-center text-gray-700">
              Segunda Edición - 12 de octubre de 2025
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {!isFirebaseAvailable && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-800">Modo demostración</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Esta es una versión de demostración. Para habilitar la inscripción real, configure las variables de
                    entorno de Firebase.
                  </p>
                </div>
              </div>
            )}

            {availableSpots > 0 ? (
              <>
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-blue-800 font-medium flex items-center justify-between">
                    <span>Cupos disponibles:</span>
                    <span className="bg-blue-100 px-3 py-1 rounded-full text-blue-700">
                      {availableSpots} de {eventSettings?.cupoMaximo || 300}
                    </span>
                  </p>
                  <div className="mt-2 pt-2 border-t border-blue-100">
                    <p className="text-blue-700 flex justify-between">
                      <span>Costo de inscripción:</span>
                      <span className="font-medium">${eventSettings?.precio || "35,000"}</span>
                    </p>
                    <p className="text-blue-700 flex justify-between mt-1">
                      <span>Método de pago:</span>
                      <span>{eventSettings?.metodoPago || "Transferencia bancaria"}</span>
                    </p>
                  </div>
                  {eventSettings?.datosPago && (
                    <div className="mt-3 pt-2 border-t border-blue-100">
                      <p className="text-blue-700 text-sm">{eventSettings.datosPago}</p>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="font-medium text-lg mb-4 text-gray-800">Información Personal</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre *</Label>
                        <Input
                          id="nombre"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="apellido">Apellido *</Label>
                        <Input
                          id="apellido"
                          name="apellido"
                          value={formData.apellido}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dni">DNI *</Label>
                        <Input id="dni" name="dni" value={formData.dni} onChange={handleInputChange} required />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fechaNacimiento">Fecha de nacimiento *</Label>
                        <Input
                          id="fechaNacimiento"
                          name="fechaNacimiento"
                          type="date"
                          value={formData.fechaNacimiento}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="localidad">Localidad *</Label>
                        <Input
                          id="localidad"
                          name="localidad"
                          value={formData.localidad}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="telefono">Teléfono *</Label>
                        <Input
                          id="telefono"
                          name="telefono"
                          value={formData.telefono}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="genero">Género *</Label>
                        <RadioGroup
                          value={formData.genero}
                          onValueChange={(value) => handleSelectChange("genero", value)}
                          className="flex flex-col space-y-1 mt-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="femenino" id="genero-femenino" />
                            <Label htmlFor="genero-femenino" className="font-normal">
                              Femenino
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="masculino" id="genero-masculino" />
                            <Label htmlFor="genero-masculino" className="font-normal">
                              Masculino
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="talleRemera">Talle de remera *</Label>
                        <Select
                          name="talleRemera"
                          value={formData.talleRemera}
                          onValueChange={(value) => handleSelectChange("talleRemera", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar talle" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="xs">XS</SelectItem>
                            <SelectItem value="s">S</SelectItem>
                            <SelectItem value="m">M</SelectItem>
                            <SelectItem value="l">L</SelectItem>
                            <SelectItem value="xl">XL</SelectItem>
                            <SelectItem value="xxl">XXL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Custom form fields */}
                  {formFields.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <h3 className="font-medium text-lg mb-4 text-gray-800">Información Adicional</h3>
                      <div className="grid grid-cols-1 gap-4">
                        {formFields.map((field) => (
                          <div key={field.id} className="space-y-2">
                            <Label htmlFor={field.id}>
                              {field.label} {field.required ? "*" : ""}
                            </Label>
                            {field.type === "text" && (
                              <Input
                                id={field.id}
                                name={field.id}
                                value={formData[field.id] || ""}
                                onChange={handleInputChange}
                                required={field.required}
                              />
                            )}
                            {field.type === "select" && (
                              <Select
                                name={field.id}
                                value={formData[field.id] || ""}
                                onValueChange={(value) => handleSelectChange(field.id, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar opción" />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            {field.type === "textarea" && (
                              <Textarea
                                id={field.id}
                                name={field.id}
                                value={formData[field.id] || ""}
                                onChange={handleInputChange}
                                required={field.required}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Condiciones de salud */}
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="font-medium text-lg mb-4 text-gray-800">Condiciones de salud</h3>

                    {/* Alergias */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="tieneAlergias"
                          checked={formData.tieneAlergias}
                          onCheckedChange={(checked) => handleCheckboxChange("tieneAlergias", checked)}
                        />
                        <Label htmlFor="tieneAlergias" className="font-medium cursor-pointer">
                          ¿Tienes alergias?
                        </Label>
                      </div>

                      {formData.tieneAlergias && (
                        <div className="ml-6">
                          <Label htmlFor="alergias">Especifique:</Label>
                          <Textarea
                            id="alergias"
                            name="alergias"
                            value={formData.alergias}
                            onChange={handleInputChange}
                            placeholder="Describa sus alergias"
                            className="mt-1"
                          />
                        </div>
                      )}
                    </div>

                    {/* Medicamentos */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="tomaMedicamentos"
                          checked={formData.tomaMedicamentos}
                          onCheckedChange={(checked) => handleCheckboxChange("tomaMedicamentos", checked)}
                        />
                        <Label htmlFor="tomaMedicamentos" className="font-medium cursor-pointer">
                          ¿Tomas medicamentos?
                        </Label>
                      </div>

                      {formData.tomaMedicamentos && (
                        <div className="ml-6">
                          <Label htmlFor="medicamentos">Especifique:</Label>
                          <Textarea
                            id="medicamentos"
                            name="medicamentos"
                            value={formData.medicamentos}
                            onChange={handleInputChange}
                            placeholder="Describa los medicamentos que toma"
                            className="mt-1"
                          />
                        </div>
                      )}
                    </div>

                    {/* Problemas de salud */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="tieneProblemasSalud"
                          checked={formData.tieneProblemasSalud}
                          onCheckedChange={(checked) => handleCheckboxChange("tieneProblemasSalud", checked)}
                        />
                        <Label htmlFor="tieneProblemasSalud" className="font-medium cursor-pointer">
                          ¿Tienes problemas de salud?
                        </Label>
                      </div>

                      {formData.tieneProblemasSalud && (
                        <div className="ml-6">
                          <Label htmlFor="problemasSalud">Especifique:</Label>
                          <Textarea
                            id="problemasSalud"
                            name="problemasSalud"
                            value={formData.problemasSalud}
                            onChange={handleInputChange}
                            placeholder="Describa sus problemas de salud"
                            className="mt-1"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="font-medium text-lg mb-4 text-gray-800">Comprobante de pago</h3>
                    <div className="space-y-2">
                      <Label htmlFor="comprobantePago">Adjunte su comprobante de pago *</Label>
                      <Input
                        id="comprobantePago"
                        name="comprobantePago"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        required
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-gray-500">Formatos aceptados: JPG, PNG, PDF. Tamaño máximo: 5MB</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 p-4 bg-pink-50 rounded-lg border border-pink-100">
                    <Checkbox
                      id="aceptaCondiciones"
                      checked={formData.aceptaCondiciones}
                      onCheckedChange={(checked) => handleCheckboxChange("aceptaCondiciones", checked)}
                      required
                      className="data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500"
                    />
                    <Label htmlFor="aceptaCondiciones" className="cursor-pointer">
                      Acepto los <span className="text-pink-600 hover:underline">términos y condiciones</span> *
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 hover:from-pink-600 hover:via-violet-600 hover:to-blue-600 py-6"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Enviando inscripción...
                      </>
                    ) : (
                      "Enviar inscripción"
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center p-8 bg-red-50 rounded-lg border border-red-100">
                <h2 className="text-2xl font-semibold text-red-600 mb-2">Cupos Agotados</h2>
                <p className="text-gray-700 mb-4">Lo sentimos, no hay más cupos disponibles para esta edición.</p>
                <Button
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  Volver al inicio
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-gradient-to-r from-pink-50 to-blue-50 rounded-b-lg py-4 text-center text-sm text-gray-500">
            Para consultas sobre la inscripción, contacta a{" "}
            <span className="text-pink-600">info@cicloturismotermal.com</span>
          </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
