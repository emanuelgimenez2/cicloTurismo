"use client"

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { db, storage } from '../../..//lib/firebase/firebase-config';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import {
  Badge
} from '@/components/ui/badge';
import {
  Separator
} from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Trash2, Edit3, Plus, X, Check, Upload, ExternalLink, ImageIcon, AlertCircle, RefreshCw } from 'lucide-react';

interface Sponsor {
  id: string;
  name: string;
  website?: string;
  image?: File | null;
  imageBase64: string;
  createdAt: Date;
}

const SponsorsEditor = () => {
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    image: null as File | null,
    imagePreview: ''
  });
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({
    show: false,
    message: '',
    type: 'success' as 'success' | 'error'
  });
  const [loadingSponsors, setLoadingSponsors] = useState(true);

  useEffect(() => {
    loadSponsors();
  }, []);

  const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ ...alert, show: false });
    }, 3000);
  };

  const loadSponsors = async (): Promise<void> => {
    setLoadingSponsors(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'sponsors'));
      const sponsorsData: Sponsor[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as Sponsor));

      // Ordenar por fecha de creación (más reciente primero)
      sponsorsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setSponsors(sponsorsData);
    } catch (error) {
      console.error('Error cargando sponsors:', error);
      showAlert('Error al cargar sponsors', 'error');
    } finally {
      setLoadingSponsors(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: file, imagePreview: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.name) {
        showAlert('El nombre del sponsor es obligatorio', 'error');
        return;
      }

      if (!formData.image && !editingId) {
        showAlert('La imagen del sponsor es obligatoria', 'error');
        return;
      }

      let imageUrl = formData.imagePreview;

      if (formData.image) {
        const imageRef = ref(storage, `sponsors/${uuidv4()}-${formData.image.name}`);
        await uploadBytes(imageRef, formData.image);
        imageUrl = await getDownloadURL(imageRef);
      }

      const sponsorData = {
        name: formData.name,
        website: formData.website,
        imageBase64: imageUrl,
        createdAt: new Date()
      };

      if (editingId) {
        const sponsorDocRef = doc(db, 'sponsors', editingId);
        await updateDoc(sponsorDocRef, sponsorData);
        showAlert('Sponsor actualizado con éxito');
      } else {
        await addDoc(collection(db, 'sponsors'), sponsorData);
        showAlert('Sponsor agregado con éxito');
      }

      resetForm();
      loadSponsors();
    } catch (error) {
      console.error('Error al guardar el sponsor:', error);
      showAlert('Error al guardar el sponsor', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este sponsor?')) {
      try {
        const sponsorDocRef = doc(db, 'sponsors', id);
        await deleteDoc(sponsorDocRef);
        setSponsors(sponsors.filter(sponsor => sponsor.id !== id));
        showAlert('Sponsor eliminado con éxito');
      } catch (error) {
        console.error('Error al eliminar el sponsor:', error);
        showAlert('Error al eliminar el sponsor', 'error');
      }
    }
  };

  const handleEdit = (sponsor: Sponsor): void => {
    setFormData({
      name: sponsor.name,
      website: sponsor.website,
      image: null,
      imagePreview: sponsor.imageBase64
    });
    setEditingId(sponsor.id);

    // Scroll al formulario
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      website: '',
      image: null,
      imagePreview: ''
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-8">
      {/* Alert mejorado */}
      {alert.show && (
        <Alert className={`
        border-l-4 shadow-sm transition-all duration-300
        ${alert.type === 'error'
            ? 'border-red-500 bg-red-50 text-red-800'
            : 'border-green-500 bg-green-50 text-green-800'
          }
      `}>
          <AlertCircle className={`h-4 w-4 ${alert.type === 'error' ? 'text-red-600' : 'text-green-600'}`} />
          <div className="ml-2">
            <div className="font-medium">{alert.type === 'error' ? 'Error' : 'Éxito'}</div>
            <AlertDescription className="mt-1">{alert.message}</AlertDescription>
          </div>
        </Alert>
      )}

      {/* Formulario mejorado */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className={`${
          editingId
            ? 'bg-gradient-to-r from-amber-500 to-orange-600'
            : 'bg-gradient-to-r from-blue-500 to-indigo-600'
          } text-white`}>
          <CardTitle className="flex items-center gap-2 text-xl">
            {editingId ? <Edit3 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {editingId ? 'Editar Sponsor' : 'Agregar Nuevo Sponsor'}
          </CardTitle>
          <CardDescription className="text-white/80">
            {editingId
              ? 'Modifica la información del sponsor seleccionado'
              : 'Complete el formulario para registrar un nuevo sponsor'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Nombre del Sponsor <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ej: Empresa ABC"
                  className="h-10 border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="text-sm font-medium">
                  Sitio Web <span className="text-gray-400">(opcional)</span>
                </Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://ejemplo.com"
                  className="h-10 border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="image" className="text-sm font-medium">
                  Logo del Sponsor {!editingId && <span className="text-red-500">*</span>}
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('image')?.click()}
                    className="flex items-center gap-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <ImageIcon className="h-4 w-4 text-gray-500" />
                    Seleccionar imagen
                  </Button>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <span className="text-sm text-gray-500">
                    {formData.image ? formData.image.name : 'Ningún archivo seleccionado'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Formatos soportados: JPG, PNG, GIF. Tamaño máximo: 5MB
                </p>
              </div>

              {/* Preview de imagen mejorado */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Vista previa</Label>
                <div className={`
                relative w-full h-32 border-2 border-dashed rounded-lg overflow-hidden flex items-center justify-center
                ${formData.imagePreview ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}
              `}>
                  {formData.imagePreview ? (
                    <img
                      src={formData.imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Vista previa no disponible</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="flex flex-wrap gap-3 justify-end">
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm} className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Cancelar edición
                </Button>
              )}

              <Button
                type="submit"
                disabled={loading}
                className={`flex items-center gap-2 ${
                  editingId
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                  }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {editingId ? 'Actualizando...' : 'Guardando...'}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    {editingId ? 'Actualizar Sponsor' : 'Agregar Sponsor'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Sponsors mejorada */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                Sponsors Registrados
                <Badge variant="outline" className="ml-2 bg-white">
                  {sponsors.length}
                </Badge>
              </CardTitle>
              <CardDescription>Gestiona los patrocinadores de tu evento</CardDescription>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={loadSponsors}
                    disabled={loadingSponsors}
                    className="h-8 w-8 rounded-full bg-white"
                  >
                    <RefreshCw className={`h-4 w-4 ${loadingSponsors ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Actualizar lista</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loadingSponsors ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border border-gray-100">
                  <CardContent className="p-4">
                    <div className="animate-pulse space-y-3">
                      <div className="w-full h-32 bg-gray-200 rounded-lg"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="flex gap-2 pt-2">
                        <div className="h-8 bg-gray-200 rounded flex-1"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sponsors.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <Upload className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-700 mb-1">No hay sponsors registrados</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Agrega tu primer patrocinador usando el formulario de arriba para que aparezca en esta lista
              </p>
              <Button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                variant="outline"
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Sponsor
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sponsors.map((sponsor) => (
                <Card key={sponsor.id} className="group border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-300 overflow-hidden">
                  <CardContent className="p-0">
                    {/* Logo */}
                    <div className="w-full h-40 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden flex items-center justify-center p-4 border-b">
                      <img
                        src={sponsor.imageBase64 || "/placeholder.svg"}
                        alt={sponsor.name}
                        className="max-w-full max-h-full object-contain transition-transform group-hover:scale-105 duration-300"
                      />
                    </div>

                    {/* Información */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-800 group-hover:text-blue-700 transition-colors">
                          {sponsor.name}
                        </h3>
                        {sponsor.website && (
                          <a
                            href={sponsor.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm mt-1 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {sponsor.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                          </a>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                          Agregado: {sponsor.createdAt.toLocaleDateString()}
                        </p>

                        {/* Acciones */}
                        <div className="flex gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(sponsor)}
                                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Editar sponsor</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(sponsor.id)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Eliminar sponsor</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-gray-50 border-t px-6 py-4">
          <p className="text-sm text-gray-500">Los sponsors se mostrarán en la página principal del sitio web</p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SponsorsEditor;