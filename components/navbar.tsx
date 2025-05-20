"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { DialogTitle } from "@radix-ui/react-dialog"
import { DialogDescription } from "@radix-ui/react-dialog"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"
import { doc, getDoc } from "firebase/firestore"

// Ítems de navegación
const navItems = [
  { name: "Cicloturismo Termal", href: "/#top" }, // Solo en móvil
  { name: "Inicio", href: "/#inicio" },
  { name: "Nuestra Historia", href: "/#historia" },
  { name: "Evento", href: "/#Evento" },
  { name: "Fotos", href: "/#fotos" },
  { name: "Sponsors", href: "/#sponsors" },
  { name: "Contacto", href: "/#contacto" },
]

// Componente accesible visualmente oculto
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        border: 0,
        clip: "rect(0 0 0 0)",
        height: 1,
        margin: -1,
        overflow: "hidden",
        padding: 0,
        position: "absolute",
        width: 1,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  )
}

export default function Navbar() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-gradient-to-r from-pink-100 via-violet-90 to-blue-100 border-t py-2 shadow-md"
          : "bg-transparent py-2"
      )}
    >
      <div className="container mx-auto flex items-center justify-between px-4">
        {/* Logo + Título */}
        <Link href="/" className="flex items-center space-x-3">
          <img src="/logo.png" alt="Logo Cicloturismo Termal" className="h-12 w-auto" />
          <span
            className={cn(
              "font-bold bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent",
              "text-xl sm:text-2xl lg:text-3xl",
              "hidden sm:inline"
            )}
          >
            <span className="sm:inline lg:hidden">Cicloturismo</span>
            <span className="hidden lg:inline">Cicloturismo Termal</span>
          </span>
        </Link>

        {/* Navegación Desktop (desde lg para arriba) */}
        <nav className="hidden lg:flex items-center space-x-6">
          {navItems.slice(1).map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isScrolled
                  ? "text-gray-900"
                  : "text-white drop-shadow-md hover:text-gray-200"
              )}
            >
              {item.name}
            </Link>
          ))}
          <Link href="/inscripcion">
            <Button
              className={cn(
                "bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 hover:from-pink-600 hover:via-violet-600 hover:to-blue-600",
                !isScrolled && "shadow-lg"
              )}
            >
              Inscribirme
            </Button>
          </Link>
        </nav>

        {/* Navegación Móvil (desde lg para abajo) */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-12 w-12 flex items-center justify-center", !isScrolled && "text-white")}
            >
              {/* Menú hamburguesa personalizado */}
              <div className="flex flex-col justify-center items-center gap-1.5">
                <div className={cn("w-7 h-1 rounded-full bg-current", !isScrolled ? "bg-white" : "bg-gray-800")}></div>
                <div className={cn("w-7 h-1 rounded-full bg-current", !isScrolled ? "bg-white" : "bg-gray-800")}></div>
                <div className={cn("w-7 h-1 rounded-full bg-current", !isScrolled ? "bg-white" : "bg-gray-800")}></div>
              </div>
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <DialogTitle>
              <VisuallyHidden>Menú de navegación</VisuallyHidden>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Navegación principal del sitio web, contiene enlaces a las secciones y formulario de inscripción.
            </DialogDescription>

            <nav className="flex flex-col gap-4 mt-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-lg font-medium transition-colors hover:text-primary"
                >
                  {item.name}
                </Link>
              ))}
              <Link href="/inscripcion" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 hover:from-pink-600 hover:via-violet-600 hover:to-blue-600">
                  Inscribirme
                </Button>
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}