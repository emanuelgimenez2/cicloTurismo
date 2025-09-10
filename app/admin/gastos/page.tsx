"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { db } from "@/lib/firebase/firebase-config"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore"
import {
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  Calculator,
  Home,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Receipt,
  CreditCard,
  Banknote,
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

interface Expense {
  id: string
  concepto: string
  monto: number
  categoria: string
  fecha: Date
  descripcion?: string
  pagadoPor?: string
}

interface Registration {
  id: string
  precio?: string
  transfirio_a?: string
  [key: string]: any
}

const EXPENSE_CATEGORIES = [
  "Logística",
  "Alimentación",
  "Premios",
  "Marketing",
  "Equipamiento",
  "Servicios",
  "Transporte",
  "Otros",
]

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    concepto: "",
    monto: "",
    categoria: "",
    descripcion: "",
    pagadoPor: "",
  })

  // Financial calculations
  const totalIncome = registrations.reduce((total, reg) => {
    const precio = reg.precio || "0"
    const amount = precio.replace(/[$.,]/g, "")
    return total + (Number.parseInt(amount) || 0)
  }, 0)

  const giseIncome = registrations
    .filter((reg) => reg.transfirio_a === "Gise")
    .reduce((total, reg) => {
      const precio = reg.precio || "0"
      const amount = precio.replace(/[$.,]/g, "")
      return total + (Number.parseInt(amount) || 0)
    }, 0)

  const bruniIncome = registrations
    .filter((reg) => reg.transfirio_a === "Bruni")
    .reduce((total, reg) => {
      const precio = reg.precio || "0"
      const amount = precio.replace(/[$.,]/g, "")
      return total + (Number.parseInt(amount) || 0)
    }, 0)

  const totalExpenses = expenses.reduce((total, expense) => total + expense.monto, 0)
  const remainingMoney = totalIncome - totalExpenses
  const expensePercentage = totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0

  const fetchData = async () => {
    try {
      // Fetch expenses
      const expensesRef = collection(db, "gastos2025")
      const expensesSnapshot = await getDocs(expensesRef)
      const expensesData: Expense[] = expensesSnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          fecha: data.fecha?.toDate() || new Date(),
        }
      })
      setExpenses(expensesData.sort((a, b) => b.fecha.getTime() - a.fecha.getTime()))

      // Fetch registrations for income calculation
      const registrationsRef = collection(db, "participantes2025")
      const currentYearRegistrations = query(registrationsRef, where("year", "==", new Date().getFullYear()))
      const registrationsSnapshot = await getDocs(currentYearRegistrations)
      const registrationsData: Registration[] = registrationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setRegistrations(registrationsData.filter((reg) => reg.estado !== "rechazado"))
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.concepto || !formData.monto || !formData.categoria) {
      return
    }

    try {
      const expenseData = {
        concepto: formData.concepto,
        monto: Number.parseFloat(formData.monto),
        categoria: formData.categoria,
        descripcion: formData.descripcion,
        pagadoPor: formData.pagadoPor,
        fecha: new Date(),
      }

      if (editingExpense) {
        // Update existing expense
        await updateDoc(doc(db, "gastos2025", editingExpense.id), expenseData)
        setIsEditModalOpen(false)
        setEditingExpense(null)
      } else {
        // Add new expense
        await addDoc(collection(db, "gastos2025"), expenseData)
        setIsAddModalOpen(false)
      }

      // Reset form
      setFormData({
        concepto: "",
        monto: "",
        categoria: "",
        descripcion: "",
        pagadoPor: "",
      })

      // Refresh data
      fetchData()
    } catch (error) {
      console.error("Error saving expense:", error)
    }
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setFormData({
      concepto: expense.concepto,
      monto: expense.monto.toString(),
      categoria: expense.categoria,
      descripcion: expense.descripcion || "",
      pagadoPor: expense.pagadoPor || "",
    })
    setIsEditModalOpen(true)
  }

  const handleDelete = async (expenseId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este gasto?")) {
      try {
        await deleteDoc(doc(db, "gastos2025", expenseId))
        fetchData()
      } catch (error) {
        console.error("Error deleting expense:", error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      concepto: "",
      monto: "",
      categoria: "",
      descripcion: "",
      pagadoPor: "",
    })
    setEditingExpense(null)
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Logística: "bg-blue-100 text-blue-800",
      Alimentación: "bg-green-100 text-green-800",
      Premios: "bg-yellow-100 text-yellow-800",
      Marketing: "bg-purple-100 text-purple-800",
      Equipamiento: "bg-red-100 text-red-800",
      Servicios: "bg-indigo-100 text-indigo-800",
      Transporte: "bg-orange-100 text-orange-800",
      Otros: "bg-gray-100 text-gray-800",
    }
    return colors[category] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex flex-col md:flex-row md:items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Gestión de Gastos
            </h1>
            <p className="text-muted-foreground mt-2">Control financiero del evento {new Date().getFullYear()}</p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <Link href="/admin/dashboard">
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Home className="h-4 w-4" />
                Volver al Dashboard
              </Button>
            </Link>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                  <Plus className="h-4 w-4" />
                  Agregar Gasto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Agregar Nuevo Gasto</DialogTitle>
                  <DialogDescription>Registra un nuevo gasto para el evento</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="concepto">Concepto *</Label>
                    <Input
                      id="concepto"
                      value={formData.concepto}
                      onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                      placeholder="Ej: Compra de premios"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="monto">Monto *</Label>
                    <Input
                      id="monto"
                      type="number"
                      value={formData.monto}
                      onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                      placeholder="0"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoria">Categoría *</Label>
                    <Select
                      value={formData.categoria}
                      onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="pagadoPor">Pagado por</Label>
                    <Select
                      value={formData.pagadoPor}
                      onValueChange={(value) => setFormData({ ...formData, pagadoPor: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="¿Quién pagó?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Gise">Gise</SelectItem>
                        <SelectItem value="Bruni">Bruni</SelectItem>
                        <SelectItem value="Ambos">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      placeholder="Detalles adicionales (opcional)"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddModalOpen(false)
                        resetForm()
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button type="submit">
                      <Save className="h-4 w-4 mr-2" />
                      Guardar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-800">Total Ingresos</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">${totalIncome.toLocaleString()}</div>
                <div className="text-xs text-green-700 mt-2">
                  Gise: ${giseIncome.toLocaleString()} | Bruni: ${bruniIncome.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-800">Total Gastos</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-900">${totalExpenses.toLocaleString()}</div>
                <div className="text-xs text-red-700 mt-2">{expenses.length} gastos registrados</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card
              className={`border-${remainingMoney >= 0 ? "blue" : "orange"}-200 bg-gradient-to-br from-${remainingMoney >= 0 ? "blue" : "orange"}-50 to-${remainingMoney >= 0 ? "blue" : "orange"}-100`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={`text-sm font-medium text-${remainingMoney >= 0 ? "blue" : "orange"}-800`}>
                  {remainingMoney >= 0 ? "Dinero Disponible" : "Déficit"}
                </CardTitle>
                {remainingMoney >= 0 ? (
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold text-${remainingMoney >= 0 ? "blue" : "orange"}-900`}>
                  ${Math.abs(remainingMoney).toLocaleString()}
                </div>
                <div className={`text-xs text-${remainingMoney >= 0 ? "blue" : "orange"}-700 mt-2`}>
                  {remainingMoney >= 0 ? "Sobra dinero" : "Falta dinero"}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-800">% Gastado</CardTitle>
                <Calculator className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900">{expensePercentage}%</div>
                <div className="mt-2">
                  <Progress
                    value={expensePercentage}
                    className="h-2"
                    indicatorClassName="bg-gradient-to-r from-purple-500 to-purple-600"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Expenses List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Lista de Gastos
              </CardTitle>
              <CardDescription>Todos los gastos registrados para el evento</CardDescription>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No hay gastos registrados aún</p>
                  <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Primer Gasto
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{expense.concepto}</h3>
                          <Badge className={getCategoryColor(expense.categoria)}>{expense.categoria}</Badge>
                          {expense.pagadoPor && (
                            <Badge variant="outline" className="text-xs">
                              Pagado por: {expense.pagadoPor}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Banknote className="h-4 w-4" />${expense.monto.toLocaleString()}
                          </span>
                          <span>{expense.fecha.toLocaleDateString()}</span>
                        </div>
                        {expense.descripcion && <p className="text-sm text-gray-500 mt-1">{expense.descripcion}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(expense)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(expense.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Gasto</DialogTitle>
              <DialogDescription>Modifica los detalles del gasto seleccionado</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="edit-concepto">Concepto *</Label>
                <Input
                  id="edit-concepto"
                  value={formData.concepto}
                  onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                  placeholder="Ej: Compra de premios"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-monto">Monto *</Label>
                <Input
                  id="edit-monto"
                  type="number"
                  value={formData.monto}
                  onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-categoria">Categoría *</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-pagadoPor">Pagado por</Label>
                <Select
                  value={formData.pagadoPor}
                  onValueChange={(value) => setFormData({ ...formData, pagadoPor: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="¿Quién pagó?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gise">Gise</SelectItem>
                    <SelectItem value="Bruni">Bruni</SelectItem>
                    <SelectItem value="Ambos">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-descripcion">Descripción</Label>
                <Textarea
                  id="edit-descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Detalles adicionales (opcional)"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditModalOpen(false)
                    resetForm()
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
