
"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import CarouselEditor from "@/components/admin/carousel-editor"
import JerseyEditor from "@/components/admin/jersey-editor"
import BenefitsEditor from "@/components/admin/benefits-editor"
import SponsorsEditor from "@/components/admin/sponsors-editor"
import PhotosEditor from "@/components/admin/photos-editor"
import ContactEditor from "@/components/admin/contact-editor"
import FormEditor from "@/components/admin/form-editor"

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState("carousel")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Contenido</h1>
        <p className="text-muted-foreground">Edita el contenido del sitio web</p>
      </div>

      <Alert variant="destructive" className="border-red-600 bg-red-100">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <AlertDescription className="text-red-600 font-bold">
          ESTO POR EL MOMENTO NO ESTÁ FUNCIONANDO, TODAVÍA ESTÁ BAJO MODIFICACIÓN. NO TOCAR
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="carousel" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="carousel">Carrusel</TabsTrigger>
          <TabsTrigger value="jersey">Remera</TabsTrigger>
          <TabsTrigger value="benefits">Beneficios</TabsTrigger>
          <TabsTrigger value="photos">Fotos</TabsTrigger>
          <TabsTrigger value="sponsors">Sponsors</TabsTrigger>
          <TabsTrigger value="contact">Contacto</TabsTrigger>
          <TabsTrigger value="form">Formulario</TabsTrigger>
        </TabsList>

        <TabsContent value="carousel">
          <Card>
            <CardHeader>
              <CardTitle>Carrusel de Inicio</CardTitle>
              <CardDescription>Edita las imágenes y el botón del carrusel en la página de inicio</CardDescription>
            </CardHeader>
            <CardContent>
              <CarouselEditor />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jersey">
          <Card>
            <CardHeader>
              <CardTitle>Remera Oficial</CardTitle>
              <CardDescription>Edita la información e imagen de la remera oficial</CardDescription>
            </CardHeader>
            <CardContent>
              <JerseyEditor />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benefits">
          <Card>
            <CardHeader>
              <CardTitle>Beneficios de la Inscripción</CardTitle>
              <CardDescription>Edita la lista de beneficios incluidos en la inscripción</CardDescription>
            </CardHeader>
            <CardContent>
              <BenefitsEditor />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos">
          <Card>
            <CardHeader>
              <CardTitle>Galería de Fotos</CardTitle>
              <CardDescription>Administra las fotos del evento</CardDescription>
            </CardHeader>
            <CardContent>
              <PhotosEditor />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sponsors">
          <Card>
            <CardHeader>
              <CardTitle>Sponsors</CardTitle>
              <CardDescription>Administra los logos, nombres y enlaces de los sponsors</CardDescription>
            </CardHeader>
            <CardContent>
              <SponsorsEditor />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
              <CardDescription>Edita la información de contacto y el mapa</CardDescription>
            </CardHeader>
            <CardContent>
              <ContactEditor />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form">
          <Card>
            <CardHeader>
              <CardTitle>Formulario de Inscripción</CardTitle>
              <CardDescription>Personaliza los campos del formulario de inscripción</CardDescription>
            </CardHeader>
            <CardContent>
              <FormEditor />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}