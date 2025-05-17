
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "Inicio", href: "/#inicio" },
  { name: "Nuestra Historia", href: "/#historia" },
  { name: "Qué incluye", href: "/#beneficios" },
  { name: "Fotos", href: "/#fotos" },
  { name: "Sponsors", href: "/#sponsors" },
  { name: "Contacto", href: "/#contacto" },
]

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

  const isHomePage = pathname === "/"

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-gradient-to-r from-pink-100 via-violet-90 to-blue-100 border-t py-2 shadow-md"  : "bg-transparent py-2"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-2">
        <Link href="/" className="flex items-center space-x-2">
          <span className={cn(
            "text-xl font-bold",
            isScrolled
              ? "bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent"
              : "bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent"
          )}>
            Cicloturismo Termal
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isScrolled ? "text-gray-900" : "text-white drop-shadow-md hover:text-gray-200"
              )}
            >
              {item.name}
            </Link>
          ))}
          <Link href="/inscripcion">
            <Button className={cn(
              "bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 hover:from-pink-600 hover:via-violet-600 hover:to-blue-600",
              !isScrolled && "shadow-lg"
            )}>
              Inscribirme
            </Button>
          </Link>
        </nav>

        {/* Mobile Navigation */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className={!isScrolled ? "text-white" : ""}>
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
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