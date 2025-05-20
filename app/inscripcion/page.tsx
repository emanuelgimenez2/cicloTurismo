"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase/firebase-config";

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertCircle,
  UploadCloud,
  Loader2,
  CheckCircle2,
  Home,
  Info,
  FileText,
  DollarSign,
} from "lucide-react";

// Toast personalizado para el ejemplo
const useToast = () => {
  const [showMore, setShowMore] = useState(false);
  const [toasts, setToasts] = useState([]);

  const toast = ({ title, description, variant = "default" }) => {
    const id = Date.now();
    const newToast = { id, title, description, variant };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  return { toast, toasts };
};

// Componente Toast
const Toast = ({ toast, onClose }) => {
  const bgColor =
    toast.variant === "destructive"
      ? "bg-red-500"
      : toast.variant === "success"
      ? "bg-green-500"
      : "bg-blue-500";

  return (
    <div
      className={`${bgColor} text-white p-3 rounded-lg shadow-lg mb-2 transition-all`}
    >
      <div className="font-medium">{toast.title}</div>
      {toast.description && <div className="text-sm">{toast.description}</div>}
    </div>
  );
};

// Contenedor de toasts
const ToastContainer = ({ toasts }) => (
  <div className="fixed top-4 right-4 z-50 space-y-2">
    {toasts.map((toast) => (
      <Toast key={toast.id} toast={toast} />
    ))}
  </div>
);

// Componente de guía de talles mejorado
const TallesRemeraMejorado = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="mt-2 text-xs flex items-center gap-1 text-blue-600"
        >
          <Info className="h-3 w-3" />
          Ver guía de talles
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-4 border-b">
          <h3 className="font-medium text-sm">Guía de talles de remeras</h3>
          <p className="text-xs text-gray-500 mt-1">
            Medidas aproximadas en centímetros
          </p>
        </div>
        <div className="p-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-2 border">Talle</th>
                <th className="p-2 border">Ancho (cm)</th>
                <th className="p-2 border">Largo (cm)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border text-center">XS</td>
                <td className="p-2 border text-center">48</td>
                <td className="p-2 border text-center">60</td>
              </tr>
              <tr>
                <td className="p-2 border text-center">S</td>
                <td className="p-2 border text-center">50</td>
                <td className="p-2 border text-center">61</td>
              </tr>
              <tr>
                <td className="p-2 border text-center">M</td>
                <td className="p-2 border text-center">52</td>
                <td className="p-2 border text-center">63</td>
              </tr>
              <tr>
                <td className="p-2 border text-center">L</td>
                <td className="p-2 border text-center">54</td>
                <td className="p-2 border text-center">65</td>
              </tr>
              <tr>
                <td className="p-2 border text-center">XL</td>
                <td className="p-2 border text-center">56</td>
                <td className="p-2 border text-center">67</td>
              </tr>
              <tr>
                <td className="p-2 border text-center">XXL</td>
                <td className="p-2 border text-center">58</td>
                <td className="p-2 border text-center">69</td>
              </tr>
                <tr>
                <td className="p-2 border text-center">XXXL</td>
                <td className="p-2 border text-center">60</td>
                <td className="p-2 border text-center">71</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-2 text-xs text-gray-500">
            <p>Las medidas pueden tener una variación de ±2cm.</p>
            <p className="mt-1">
              El ancho se mide de axila a axila y el largo desde el hombro hasta
              el borde inferior.
            </p>
            <div className="mt-2 flex justify-center">
              <div className="border rounded p-2 bg-gray-50">
                <div className="w-32 h-40 relative mx-auto">
                  {/* Representación esquemática de una remera */}
                  <div className="w-full h-full bg-blue-100 rounded-lg relative">
                    {/* Cuello */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-3 bg-white rounded-b-lg"></div>
                    {/* Línea de ancho */}
                    <div className="absolute top-10 w-full border-t border-blue-400 border-dashed flex justify-center">
                      <span className="bg-white px-1 text-xs text-blue-600 -mt-2">
                        Ancho
                      </span>
                    </div>
                    {/* Línea de largo */}
                    <div className="absolute top-2 left-1/2 h-36 border-l border-blue-400 border-dashed flex items-center">
                      <span className="bg-white px-1 text-xs text-blue-600 -ml-8">
                        Largo
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default function RegistrationForm() {
  const { toast, toasts } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [showMore, setShowMore] = useState(false);
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
  telefonoEmergencia: "",
  grupoSanguineo: "",
  genero: "",
  grupoCiclistas: "",
  talleRemera: "",
  condicionesSalud: "",
  aceptaCondiciones: false,
  comprobantePago: null,
  comprobantePagoUrl: "",
});
  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const goToHomePage = () => {
    window.location.href = "/";
  };

  const validateName = (value) => {
    return /^[A-Za-zÁáÉéÍíÓóÚúÜüÑñ\s]+$/.test(value);
  };

  const validateDNI = (value) => {
    return /^\d{7,8}$/.test(value);
  };

  const validateEmail = (value) => {
    if (!value) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const validatePhone = (value) => {
    if (!value) return true;
    return /^\d{10,15}$/.test(value.replace(/\D/g, ""));
  };

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
    const errors = {};
    
    if (!formData.nombre) errors.nombre = "El nombre es obligatorio";
    else if (!validateName(formData.nombre)) errors.nombre = "El nombre solo debe contener letras";
    
    if (!formData.apellido) errors.apellido = "El apellido es obligatorio";
    else if (!validateName(formData.apellido)) errors.apellido = "El apellido solo debe contener letras";
    
    if (!formData.dni) errors.dni = "El DNI es obligatorio";
    else if (!validateDNI(formData.dni)) errors.dni = "El DNI debe tener 7-8 dígitos";
    
    if (formData.email && !validateEmail(formData.email)) 
      errors.email = "Formato de email inválido";
    
    if (formData.telefono && !validatePhone(formData.telefono)) 
      errors.telefono = "Formato de teléfono inválido";
    
    if (!formData.aceptaCondiciones) 
      errors.aceptaCondiciones = "Debe aceptar los términos y condiciones";
    
    if (!formData.comprobantePago) 
      errors.comprobantePago = "Debe adjuntar un comprobante de pago";
    
    setFieldErrors(errors);
    
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

    // Estructura para condiciones de salud y medicamentos
    const condicionSalud = {
      condicionesSalud: formData.condicionesSalud || "",
    };

    // Datos completos para Firestore según el formulario
    const registrationData = {
      // Datos personales
      nombre: formData.nombre,
      apellido: formData.apellido,
      dni: formData.dni,
      fechaNacimiento: formData.fechaNacimiento || "",
      localidad: formData.localidad || "",
      email: formData.email || "",
      telefono: formData.telefono || "",
      telefonoEmergencia: formData.telefonoEmergencia || "",
      grupoSanguineo: formData.grupoSanguineo || "",
      genero: formData.genero || "",
      grupoCiclistas: formData.grupoCiclistas || "",
      talleRemera: formData.talleRemera || "",
      
      // Condiciones de salud (ahora como texto completo)
      condicionSalud: JSON.stringify(condicionSalud),
      
      // Datos del comprobante de pago
      comprobantePagoUrl: fileUrl,
      imagenBase64: fileUrl ? "" : imagenBase64,
      nombreArchivo: formData.comprobantePago?.name || "comprobante.jpg",
      
      // Metadatos
      fechaInscripcion: new Date().toISOString(),
      year: new Date().getFullYear(),
      estado: "pendiente",
      aceptaTerminos: formData.aceptaCondiciones,
    };

    const docRef = await addDoc(
      collection(db, "participantes2025"),
      registrationData
    );

    toast({
      title: "¡Inscripción exitosa!",
      description: "Tu inscripción ha sido registrada correctamente",
      variant: "success",
    });

    setSubmitted(true);
    setShowSuccessDialog(true);

    // Restablecer formulario
    setFormData({
      nombre: "",
      apellido: "",
      dni: "",
      fechaNacimiento: "",
      localidad: "",
      email: "",
      telefono: "",
      telefonoEmergencia: "",
      grupoSanguineo: "",
      genero: "",
      grupoCiclistas: "",
      talleRemera: "",
      condicionesSalud: "",
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
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
      <ToastContainer toasts={toasts} />

      <main className="container mx-auto px-4 py-8">
        <div ref={topRef}></div>

        <div className="max-w-4xl mx-auto mb-6">
          <Button
            onClick={goToHomePage}
            variant="outline"
            className="flex items-center gap-2 bg-white hover:bg-gray-100"
          >
            <Home className="h-4 w-4" />
            Volver a la página principal
          </Button>
        </div>

        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="bg-white border-green-200 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-green-700 flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                ¡Felicidades!
              </DialogTitle>
              <DialogDescription className="text-green-700">
                Tu inscripción ha sido registrada exitosamente. Pronto recibirás
                un correo de confirmación con los detalles de tu participación
                en el Cicloturismo Termal.
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
              Inscripción Cicloturismo Termal
            </CardTitle>
            <CardDescription className="text-center text-gray-700">
              Complete el formulario para registrarse en el evento
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
                        <span className="text-red-500 text-xs">
                          {fieldErrors.nombre}
                        </span>
                      )}
                    </Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      className={fieldErrors.nombre ? "border-red-500" : ""}
                      placeholder="Ej: Juan Carlos"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apellido" className="flex justify-between">
                      <span>Apellido *</span>
                      {fieldErrors.apellido && (
                        <span className="text-red-500 text-xs">
                          {fieldErrors.apellido}
                        </span>
                      )}
                    </Label>
                    <Input
                      id="apellido"
                      name="apellido"
                      value={formData.apellido}
                      onChange={handleInputChange}
                      className={fieldErrors.apellido ? "border-red-500" : ""}
                      placeholder="Ej: Gómez"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dni" className="flex justify-between">
                      <span>DNI *</span>
                      {fieldErrors.dni && (
                        <span className="text-red-500 text-xs">
                          {fieldErrors.dni}
                        </span>
                      )}
                    </Label>
                    <Input
                      id="dni"
                      name="dni"
                      value={formData.dni}
                      onChange={handleInputChange}
                      className={fieldErrors.dni ? "border-red-500" : ""}
                      placeholder="Ej: 32456789"
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
                      placeholder="Ej: Buenos Aires"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex justify-between">
                      <span>Email</span>
                      {fieldErrors.email && (
                        <span className="text-red-500 text-xs">
                          {fieldErrors.email}
                        </span>
                      )}
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={fieldErrors.email ? "border-red-500" : ""}
                      placeholder="Ej: ejemplo@correo.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono" className="flex justify-between">
                      <span>Teléfono</span>
                      {fieldErrors.telefono && (
                        <span className="text-red-500 text-xs">
                          {fieldErrors.telefono}
                        </span>
                      )}
                    </Label>
                    <Input
                      id="telefono"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      className={fieldErrors.telefono ? "border-red-500" : ""}
                      placeholder="Ej: 11 5555 5555"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="telefonoEmergencia"
                      className="flex justify-between"
                    >
                      <span>Teléfono de emergencia</span>
                      {fieldErrors.telefonoEmergencia && (
                        <span className="text-red-500 text-xs">
                          {fieldErrors.telefonoEmergencia}
                        </span>
                      )}
                    </Label>
                    <Input
                      id="telefonoEmergencia"
                      name="telefonoEmergencia"
                      value={formData.telefonoEmergencia}
                      onChange={handleInputChange}
                      className={
                        fieldErrors.telefonoEmergencia ? "border-red-500" : ""
                      }
                      placeholder="Ej: 11 4444 4444"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grupoSanguineo">Grupo sanguíneo</Label>
                    <Select
                      name="grupoSanguineo"
                      value={formData.grupoSanguineo}
                      onValueChange={(value) =>
                        handleSelectChange("grupoSanguineo", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar grupo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a+">A+</SelectItem>
                        <SelectItem value="a-">A-</SelectItem>
                        <SelectItem value="b+">B+</SelectItem>
                        <SelectItem value="b-">B-</SelectItem>
                        <SelectItem value="ab+">AB+</SelectItem>
                        <SelectItem value="ab-">AB-</SelectItem>
                        <SelectItem value="o+">O+</SelectItem>
                        <SelectItem value="o-">O-</SelectItem>
                        <SelectItem value="desconocido">Desconocido</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="otro" id="genero-otro" />
                        <Label htmlFor="genero-otro" className="font-normal">
                          Prefiero no especificar
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grupoCiclistas">Grupo de ciclistas</Label>
                    <Input
                      id="grupoCiclistas"
                      name="grupoCiclistas"
                      value={formData.grupoCiclistas}
                      onChange={handleInputChange}
                      placeholder="Ej: Team Riders, Ciclistas del Sur..."
                    />
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
                    <TallesRemeraMejorado />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-medium text-lg mb-4 text-gray-800">
                  Condiciones de salud y medicamentos
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="condicionesSalud">
                    Indique cualquier condición de salud, alergias o
                    medicamentos que debamos conocer:
                  </Label>
                  <Textarea
                    id="condicionesSalud"
                    name="condicionesSalud"
                    value={formData.condicionesSalud}
                    onChange={handleInputChange}
                    placeholder="Describa aquí alergias, medicamentos que toma regularmente o cualquier condición de salud relevante para la actividad física."
                    className="min-h-32"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Esta información es importante para asegurar su bienestar
                    durante el evento. Si no tiene condiciones especiales de
                    salud, puede dejar este campo en blanco.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-medium text-lg mb-2 text-blue-800 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Información de pago
                </h3>
                <Alert className="bg-white border-blue-200 mb-4">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <AlertTitle className="text-blue-800">
                    Datos de transferencia
                  </AlertTitle>
                  <AlertDescription className="text-blue-700">
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Banco: Banco Nación</li>
                      <li>Titular: Asociación Cicloturismo Termal</li>
                      <li>CUIT: 30-71234567-8</li>
                      <li>CBU: 0110599420000012345678</li>
                      <li>Alias: ciclo.termal</li>
                      <li>
                        <strong>Importe: $15.000</strong>
                      </li>
                    </ul>
                    <p className="mt-3 text-sm font-medium">
                      En el concepto de la transferencia, incluya su nombre,
                      apellido y DNI.
                    </p>
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="comprobantePago"
                      className="flex justify-between"
                    >
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        Comprobante de pago *
                      </span>
                      {fieldErrors.comprobantePago && (
                        <span className="text-red-500 text-xs">
                          {fieldErrors.comprobantePago}
                        </span>
                      )}
                    </Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                      <UploadCloud className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <Input
                        id="comprobantePago"
                        name="comprobantePago"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="comprobantePago"
                        className="cursor-pointer"
                      >
                        <span className="text-blue-600 font-medium hover:text-blue-700">
                          Haga clic para subir el comprobante
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          PDF, JPG, PNG (máx. 10MB)
                        </p>
                      </label>
                      {formData.comprobantePago && (
                        <div className="mt-2 p-2 bg-green-50 rounded border text-xs">
                          <CheckCircle2 className="h-4 w-4 text-green-600 inline mr-1" />
                          Archivo seleccionado: {formData.comprobantePago.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="font-medium text-lg mb-4 text-yellow-800">
                  Términos y Condiciones
                </h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <p>
                    Al participar en el Cicloturismo Termal, acepta las
                    siguientes condiciones:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Participa bajo su propia responsabilidad y riesgo</li>
                   
                   
                    {showMore && (
                      <>
                       <li>
                      Debe contar con bicicleta en buen estado y equipo de
                      seguridad
                    </li>
                       <li>
                      Es obligatorio el uso de casco durante toda la actividad
                    </li>
                    <li>
                      Se compromete a respetar las normas de tránsito y las
                      indicaciones de los organizadores
                    </li>
                        <li>
                          Autoriza el uso de imágenes tomadas durante el evento
                          para fines promocionales
                        </li>
                        <li>
                          La organización no se hace responsable por pérdidas,
                          daños o lesiones durante el evento
                        </li>
                        <li>
                          El evento se realizará con lluvia, solo se suspende
                          por condiciones climáticas extremas
                        </li>
                        <li>
                          Los menores de edad deben contar con autorización de
                          sus padres o tutores, presentarlo al momento de la
                          acreditacion
                        </li>
                      </>
                    )}
                  </ul>
                  <button
                    type="button"
                    onClick={() => setShowMore(!showMore)}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm underline"
                  >
                    {showMore ? "Ver menos" : "Ver más"}
                  </button>
                </div>

                <div className="flex items-start space-x-2 mt-4">
                  <Checkbox
                    id="aceptaCondiciones"
                    name="aceptaCondiciones"
                    checked={formData.aceptaCondiciones}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange("aceptaCondiciones", checked)
                    }
                    className={
                      fieldErrors.aceptaCondiciones ? "border-red-500" : ""
                    }
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor="aceptaCondiciones"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Acepto los términos y condiciones *
                    </Label>
                    {fieldErrors.aceptaCondiciones && (
                      <p className="text-red-500 text-xs">
                        {fieldErrors.aceptaCondiciones}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </CardContent>

          <CardFooter className="bg-gray-50 rounded-b-lg">
            <div className="w-full space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setFormData({
                      nombre: "",
                      apellido: "",
                      dni: "",
                      fechaNacimiento: "",
                      localidad: "",
                      email: "",
                      telefono: "",
                      telefonoEmergencia: "",
                      grupoSanguineo: "",
                      grupoCiclistas: "",
                      genero: "",
                      talleRemera: "",
                      condicionesSalud: "",
                      aceptaCondiciones: false,
                      comprobantePago: null,
                      comprobantePagoUrl: "",
                    });
                    setFieldErrors({});
                  }}
                >
                  Limpiar formulario
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-pink-500 to-blue-600 hover:from-pink-600 hover:to-blue-700"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando inscripción...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Completar inscripción
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center text-xs text-gray-500">
                <p>
                  Al enviar este formulario, confirma que toda la información
                  proporcionada es correcta y acepta los términos y condiciones
                  del evento.
                </p>
                <p className="mt-1">
                  Los campos marcados con (*) son obligatorios.
                </p>
              </div>
            </div>
          </CardFooter>
        </Card>

        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2024 Cicloturismo Termal - Todos los derechos reservados</p>
        </div>
      </main>
    </div>
  );
}
