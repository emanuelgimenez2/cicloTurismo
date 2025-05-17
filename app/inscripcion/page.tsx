"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase/firebase-config";
import { AlertCircle, UploadCloud, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function RegistrationForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const topRef = useRef(null);
  
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
    comprobantePagoUrl: "",
  });

  // Cerrar diálogo y hacer scroll al inicio
  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Validaciones individuales
  const validateName = (value) => {
    return /^[A-Za-zÁáÉéÍíÓóÚúÜüÑñ\s]+$/.test(value);
  };

  const validateDNI = (value) => {
    return /^\d{7,8}$/.test(value);
  };

  const validateEmail = (value) => {
    if (!value) return true; // Email no es obligatorio
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const validatePhone = (value) => {
    if (!value) return true; // Teléfono no es obligatorio
    return /^\d{10,15}$/.test(value.replace(/\D/g, ""));
  };

  // Función para validar un campo específico
  const validateField = (name, value) => {
    switch (name) {
      case "nombre":
        return validateName(value) ? "" : "El nombre solo debe contener letras";
      case "apellido":
        return validateName(value) ? "" : "El apellido solo debe contener letras";
      case "dni":
        return validateDNI(value) ? "" : "El DNI debe tener 7-8 dígitos";
      case "email":
        return validateEmail(value) ? "" : "Formato de email inválido";
      case "telefono":
        return validatePhone(value) ? "" : "Formato de teléfono inválido";
      default:
        return "";
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const newValue = type === "checkbox" ? e.target.checked : value;
    
    setFormData({
      ...formData,
      [name]: newValue,
    });
    
    // Validar el campo en tiempo real (solo para campos con validación)
    if (["nombre", "apellido", "dni", "email", "telefono"].includes(name)) {
      const error = validateField(name, newValue);
      setFieldErrors({
        ...fieldErrors,
        [name]: error,
      });
    }
  };

  const handleCheckboxChange = (name, checked) => {
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        comprobantePago: file,
      });
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.onerror = (error) => {
        reject(error);
      };
    });
  };

  const uploadFile = async (file) => {
    if (!file) return null;

    try {
      const storageRef = ref(
        storage,
        `comprobantes/${formData.dni || "user"}_${Date.now()}_${file.name}`
      );
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error("Error subiendo archivo:", error);
      throw error;
    }
  };

  const validateForm = () => {
    // Inicializar errores
    const errors = {};
    
    // Validar campos obligatorios
    if (!formData.nombre) errors.nombre = "El nombre es obligatorio";
    else if (!validateName(formData.nombre)) errors.nombre = "El nombre solo debe contener letras";
    
    if (!formData.apellido) errors.apellido = "El apellido es obligatorio";
    else if (!validateName(formData.apellido)) errors.apellido = "El apellido solo debe contener letras";
    
    if (!formData.dni) errors.dni = "El DNI es obligatorio";
    else if (!validateDNI(formData.dni)) errors.dni = "El DNI debe tener 7-8 dígitos";
    
    // Validar campos opcionales si tienen valor
    if (formData.email && !validateEmail(formData.email)) 
      errors.email = "Formato de email inválido";
    
    if (formData.telefono && !validatePhone(formData.telefono)) 
      errors.telefono = "Formato de teléfono inválido";
    
    // Verificar aceptación de condiciones
    if (!formData.aceptaCondiciones) 
      errors.aceptaCondiciones = "Debe aceptar los términos y condiciones";
    
    // Verificar comprobante de pago
    if (!formData.comprobantePago) 
      errors.comprobantePago = "Debe adjuntar un comprobante de pago";
    
    // Actualizar los errores y verificar si hay alguno
    setFieldErrors(errors);
    
    // Si hay errores, mostrar toast con resumen
    if (Object.keys(errors).length > 0) {
      toast({
        title: "Hay errores en el formulario",
        description: "Por favor revise los campos marcados en rojo",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      let fileUrl = "";
      let imagenBase64 = "";

      // Intentar subir archivo a Storage si está disponible
      if (formData.comprobantePago && storage) {
        try {
          fileUrl = await uploadFile(formData.comprobantePago);
        } catch (error) {
          console.error("Error en subida a Storage, usando Base64 como respaldo", error);
          imagenBase64 = await convertToBase64(formData.comprobantePago);
        }
      } else if (formData.comprobantePago) {
        imagenBase64 = await convertToBase64(formData.comprobantePago);
      }

      // Preparar información de condición de salud
      const condicionSalud = {
        tieneAlergias: formData.tieneAlergias,
        alergias: formData.alergias,
        tomaMedicamentos: formData.tomaMedicamentos,
        medicamentos: formData.medicamentos,
        tieneProblemasSalud: formData.tieneProblemasSalud,
        problemasSalud: formData.problemasSalud,
      };

      // Guardar datos de registro
      const registrationData = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        dni: formData.dni,
        fechaNacimiento: formData.fechaNacimiento || "",
        localidad: formData.localidad || "",
        email: formData.email || "",
        telefono: formData.telefono || "",
        genero: formData.genero || "",
        talleRemera: formData.talleRemera || "",
        condicionSalud: JSON.stringify(condicionSalud),
        comprobantePagoUrl: fileUrl,
        imagenBase64: fileUrl ? "" : imagenBase64, // Solo incluir Base64 si no hay URL
        nombreArchivo: formData.comprobantePago?.name || "comprobante.jpg",
        fechaInscripcion: new Date().toISOString(),
        year: new Date().getFullYear(),
        estado: "pendiente",
      };

      // Agregar documento a Firestore
      const docRef = await addDoc(
        collection(db, "participantes2025"),
        registrationData
      );

      // Mostrar mensaje de éxito
      toast({
        title: "¡Inscripción exitosa!",
        description: "Tu inscripción ha sido registrada correctamente",
        variant: "success",
      });

      // Marcar como enviado y mostrar el diálogo de éxito
      setSubmitted(true);
      setShowSuccessDialog(true);

      // Limpiar formulario después de envío exitoso
      setFormData({
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
        comprobantePagoUrl: "",
      });
    } catch (error) {
      console.error("Error al enviar formulario:", error);
      toast({
        title: "Error",
        description:
          "Hubo un problema al procesar tu inscripción. Por favor intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
      <main className="container mx-auto px-4 py-8">
        {/* Referencia para scroll al inicio */}
        <div ref={topRef}></div>
        
        {/* Diálogo de éxito */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="bg-white border-green-200 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-green-700 flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                ¡Felicidades!
              </DialogTitle>
              <DialogDescription className="text-green-700">
                Tu inscripción ha sido registrada exitosamente. Pronto recibirás un correo de confirmación con los detalles de tu participación en el Cicloturismo Termal.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                onClick={handleCloseSuccessDialog}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card className="max-w-4xl mx-auto shadow-lg">
          <CardHeader className="bg-gradient-to-r from-pink-100 to-blue-100 rounded-t-lg">
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
              Inscripción - Cicloturismo Termal
            </CardTitle>
            <CardDescription className="text-center text-gray-700">
              Complete el formulario para registrarse
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-medium text-lg mb-4 text-gray-800">
                  Información Personal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nombre" className="flex justify-between">
                      <span>Nombre *</span>
                      {fieldErrors.nombre && (
                        <span className="text-red-500 text-xs">{fieldErrors.nombre}</span>
                      )}
                    </Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      className={fieldErrors.nombre ? "border-red-500" : ""}
                      pattern="[A-Za-zÁáÉéÍíÓóÚúÜüÑñ\s]+"
                      title="El nombre solo debe contener letras"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apellido" className="flex justify-between">
                      <span>Apellido *</span>
                      {fieldErrors.apellido && (
                        <span className="text-red-500 text-xs">{fieldErrors.apellido}</span>
                      )}
                    </Label>
                    <Input
                      id="apellido"
                      name="apellido"
                      value={formData.apellido}
                      onChange={handleInputChange}
                      className={fieldErrors.apellido ? "border-red-500" : ""}
                      pattern="[A-Za-zÁáÉéÍíÓóÚúÜüÑñ\s]+"
                      title="El apellido solo debe contener letras"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dni" className="flex justify-between">
                      <span>DNI *</span>
                      {fieldErrors.dni && (
                        <span className="text-red-500 text-xs">{fieldErrors.dni}</span>
                      )}
                    </Label>
                    <Input
                      id="dni"
                      name="dni"
                      value={formData.dni}
                      onChange={handleInputChange}
                      className={fieldErrors.dni ? "border-red-500" : ""}
                      pattern="\d{7,8}"
                      title="El DNI debe tener 7-8 dígitos"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fechaNacimiento">Fecha de nacimiento</Label>
                    <Input
                      id="fechaNacimiento"
                      name="fechaNacimiento"
                      type="date"
                      value={formData.fechaNacimiento}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="localidad">Localidad</Label>
                    <Input
                      id="localidad"
                      name="localidad"
                      value={formData.localidad}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex justify-between">
                      <span>Email</span>
                      {fieldErrors.email && (
                        <span className="text-red-500 text-xs">{fieldErrors.email}</span>
                      )}
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={fieldErrors.email ? "border-red-500" : ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono" className="flex justify-between">
                      <span>Teléfono</span>
                      {fieldErrors.telefono && (
                        <span className="text-red-500 text-xs">{fieldErrors.telefono}</span>
                      )}
                    </Label>
                    <Input
                      id="telefono"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      className={fieldErrors.telefono ? "border-red-500" : ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="genero">Género</Label>
                    <RadioGroup
                      value={formData.genero}
                      onValueChange={(value) =>
                        handleSelectChange("genero", value)
                      }
                      className="flex flex-col space-y-1 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="femenino" id="genero-femenino" />
                        <Label
                          htmlFor="genero-femenino"
                          className="font-normal"
                        >
                          Femenino
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="masculino"
                          id="genero-masculino"
                        />
                        <Label
                          htmlFor="genero-masculino"
                          className="font-normal"
                        >
                          Masculino
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="talleRemera">Talle de remera</Label>
                    <Select
                      name="talleRemera"
                      value={formData.talleRemera}
                      onValueChange={(value) =>
                        handleSelectChange("talleRemera", value)
                      }
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

              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-medium text-lg mb-4 text-gray-800">
                  Condiciones de salud
                </h3>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="tieneAlergias"
                      checked={formData.tieneAlergias}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("tieneAlergias", checked)
                      }
                    />
                    <Label
                      htmlFor="tieneAlergias"
                      className="font-medium cursor-pointer"
                    >
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

                <div className="space-y-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="tomaMedicamentos"
                      checked={formData.tomaMedicamentos}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("tomaMedicamentos", checked)
                      }
                    />
                    <Label
                      htmlFor="tomaMedicamentos"
                      className="font-medium cursor-pointer"
                    >
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

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="tieneProblemasSalud"
                      checked={formData.tieneProblemasSalud}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("tieneProblemasSalud", checked)
                      }
                    />
                    <Label
                      htmlFor="tieneProblemasSalud"
                      className="font-medium cursor-pointer"
                    >
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
                <h3 className="font-medium text-lg mb-4 text-gray-800">
                  Comprobante de pago
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="comprobantePago" className="flex justify-between">
                    <span>Adjunte su comprobante de pago *</span>
                    {fieldErrors.comprobantePago && (
                      <span className="text-red-500 text-xs">{fieldErrors.comprobantePago}</span>
                    )}
                  </Label>
                  <div className={`border-2 border-dashed ${fieldErrors.comprobantePago ? 'border-red-300 bg-red-50' : 'border-gray-300'} rounded-lg p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer`}>
                    <Input
                      id="comprobantePago"
                      name="comprobantePago"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      required
                      className="hidden"
                    />
                    <label htmlFor="comprobantePago" className="cursor-pointer">
                      <UploadCloud className={`mx-auto h-12 w-12 ${fieldErrors.comprobantePago ? 'text-red-400' : 'text-gray-400'}`} />
                      <p className="mt-2 text-sm text-gray-600">
                        {formData.comprobantePago ? (
                          <>
                            Archivo seleccionado:{" "}
                            {formData.comprobantePago.name}
                          </>
                        ) : (
                          <>
                            <span className="font-medium text-blue-600">
                              Haga clic para seleccionar
                            </span>{" "}
                            o arrastre un archivo
                          </>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Formatos aceptados: JPG, PNG, PDF. Tamaño máximo: 5MB
                      </p>
                    </label>
                  </div>
                </div>
              </div>

              <div className={`flex items-center space-x-2 p-4 ${fieldErrors.aceptaCondiciones ? 'bg-red-50 border border-red-200' : 'bg-pink-50 border border-pink-100'} rounded-lg`}>
                <Checkbox
                  id="aceptaCondiciones"
                  checked={formData.aceptaCondiciones}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange("aceptaCondiciones", checked)
                  }
                  required
                  className={`${
                    fieldErrors.aceptaCondiciones 
                      ? "border-red-500" 
                      : "data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500"
                  }`}
                />
                <div>
                  <Label htmlFor="aceptaCondiciones" className="cursor-pointer">
                    Acepto los{" "}
                    <span className="text-pink-600 hover:underline">
                      términos y condiciones
                    </span>{" "}
                    *
                  </Label>
                  {fieldErrors.aceptaCondiciones && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.aceptaCondiciones}</p>
                  )}
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-800">
                    Aviso importante
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Revise cuidadosamente la información antes de enviarla.
                    Recibirá una confirmación por email una vez procesada su
                    inscripción.
                  </p>
                </div>
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
          </CardContent>
          <CardFooter className="bg-gradient-to-r from-pink-50 to-blue-50 rounded-b-lg py-4 text-center text-sm text-gray-500">
            Para consultas sobre la inscripción, contacta a{" "}
            <span className="text-pink-600">info@cicloturismotermal.com</span>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}