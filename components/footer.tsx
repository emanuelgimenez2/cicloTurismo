import Link from "next/link"
import { Facebook, Instagram, Twitter } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-pink-100 via-violet-100 to-blue-100 py-8 border-t">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
              Cicloturismo Termal
            </h3>
            <p className="text-sm text-gray-600 mb-4">Federación, Entre Ríos, Argentina</p>
            <p className="text-sm text-gray-600">12 de octubre de 2025</p>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">Enlaces rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/#inicio" className="text-sm text-gray-600 hover:text-gray-900">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/#historia" className="text-sm text-gray-600 hover:text-gray-900">
                  Remera
                </Link>
              </li>
              <li>
                <Link href="/#beneficios" className="text-sm text-gray-600 hover:text-gray-900">
                  Qué incluye
                </Link>
              </li>
              <li>
                <Link href="/#fotos" className="text-sm text-gray-600 hover:text-gray-900">
                  Fotos
                </Link>
              </li>
              <li>
                <Link href="/#sponsors" className="text-sm text-gray-600 hover:text-gray-900">
                  Sponsors
                </Link>
              </li>
              <li>
                <Link href="/#contacto" className="text-sm text-gray-600 hover:text-gray-900">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">
                  Admin
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">Síguenos</h3>
            <div className="flex space-x-4">
              <Link href="#" className="text-gray-600 hover:text-pink-500">
                <Facebook className="h-6 w-6" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-gray-600 hover:text-violet-500">
                <Instagram className="h-6 w-6" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="text-gray-600 hover:text-blue-500">
                <Twitter className="h-6 w-6" />
                <span className="sr-only">Twitter</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            &copy; {new Date().getFullYear()} Cicloturismo Termal de Federación. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
