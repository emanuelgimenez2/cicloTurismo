"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/firebase/firebase-config"
import { signOut } from "firebase/auth"
import { useToast } from "@/components/ui/use-toast"
import { LayoutDashboard, Users, FileEdit, Settings, LogOut, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: "Inscripciones",
    href: "/admin/registrations",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "Contenido",
    href: "/admin/content",
    icon: <FileEdit className="h-5 w-5" />,
  },
  {
    title: "Configuración",
    href: "/admin/settings",
    icon: <Settings className="h-5 w-5" />,
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const { toast } = useToast()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      })
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <>
      {/* Mobile sidebar toggle */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button variant="outline" size="icon" onClick={() => setIsMobileOpen(!isMobileOpen)} className="bg-white">
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen bg-white border-r transition-all duration-300 md:relative",
          isCollapsed ? "w-[70px]" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h2
              className={cn(
                "font-bold bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent transition-all",
                isCollapsed ? "text-sm" : "text-xl",
              )}
            >
              {isCollapsed ? "CT" : "Cicloturismo"}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="hidden md:flex">
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-md transition-colors",
                  pathname === item.href
                    ? "bg-gradient-to-r from-pink-100 to-blue-100 text-pink-700"
                    : "hover:bg-gray-100",
                )}
              >
                {item.icon}
                {!isCollapsed && <span>{item.title}</span>}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50",
                isCollapsed && "justify-center",
              )}
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 mr-2" />
              {!isCollapsed && <span>Cerrar sesión</span>}
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
