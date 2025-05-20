"use client";

import { useState, useEffect, FC, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/firebase/firebase-config";
import {
  collection,
  getDocs,
  query,
  where,
  DocumentData,
  Timestamp,
} from "firebase/firestore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import {
  Users,
  Calendar,
  TrendingUp,
  ShoppingBag,
  Loader2,
  Home,
  ArrowUp,
} from "lucide-react";
import { useFirebaseContext } from "@/lib/firebase/firebase-provider";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Registration {
  id: string;
  genero?: string;
  talleRemera?: string;
  fechaInscripcion: Date;
  condicionSalud?: any;
  year?: number;
  estado?: string; // Puede ser: pendiente, confirmado, rechazado, cancelado
  [key: string]: any;
}

interface CondicionSalud {
  tieneAlergias?: boolean;
  tomaMedicamentos?: boolean;
  tieneProblemasSalud?: boolean;
  [key: string]: any;
}

interface JerseySize {
  xs: number;
  s: number;
  m: number;
  l: number;
  xl: number;
  xxl: number;
  [key: string]: number;
}

interface DashboardStats {
  totalRegistrations: number;
  validRegistrations: number; // Inscripciones confirmadas + pendientes
  maleCount: number;
  femaleCount: number;
  otherCount: number;
  withHealthConditions: number;
  jerseySize: JerseySize;
  registrationsByDay: Array<{ date: string; total: number; rejected: number }>;
}

interface ChartDataItem {
  name: string;
  value: number;
}

export default function AdminDashboardPage(): JSX.Element {
  const { eventSettings } = useFirebaseContext();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalRegistrations: 0,
    validRegistrations: 0,
    maleCount: 0,
    femaleCount: 0,
    otherCount: 0,
    withHealthConditions: 0,
    jerseySize: {
      xs: 0,
      s: 0,
      m: 0,
      l: 0,
      xl: 0,
      xxl: 0,
    },
    registrationsByDay: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  // Referencia para el botón de volver arriba
  const topRef = useRef<HTMLDivElement>(null);

  // Función para volver al inicio
  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const registrationsRef = collection(db, "participantes2025");
        const currentYearRegistrations = query(
          registrationsRef,
          where("year", "==", new Date().getFullYear())
        );
        const snapshot = await getDocs(currentYearRegistrations);

        // Mantener todas las inscripciones para el gráfico total
        const registrationsData: Registration[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          // Verificar si fechaInscripcion es un timestamp de Firestore
          let fechaInscripcion: Date;
          if (
            data.fechaInscripcion &&
            typeof data.fechaInscripcion.toDate === "function"
          ) {
            fechaInscripcion = data.fechaInscripcion.toDate();
          } else if (data.fechaInscripcion instanceof Date) {
            fechaInscripcion = data.fechaInscripcion;
          } else if (data.fechaInscripcion) {
            // Intentar convertir a fecha si es una cadena o un timestamp
            fechaInscripcion = new Date(data.fechaInscripcion);
          } else {
            fechaInscripcion = new Date(); // Fecha predeterminada
          }

          return {
            id: doc.id,
            ...data,
            fechaInscripcion,
          };
        });

        setRegistrations(registrationsData);

        // Filtrar solo inscripciones confirmadas y pendientes
        const validRegistrations = registrationsData.filter(
          (reg) => reg.estado === "confirmado" || reg.estado === "pendiente"
        );

        // Contar registros rechazados para el gráfico
        const rejectedRegistrations = registrationsData.filter(
          (reg) => reg.estado === "rechazado"
        );

        // Calculate statistics
        const maleCount = validRegistrations.filter(
          (reg) => reg.genero?.toLowerCase() === "masculino"
        ).length;
        const femaleCount = validRegistrations.filter(
          (reg) => reg.genero?.toLowerCase() === "femenino"
        ).length;
        const otherCount = validRegistrations.filter(
          (reg) =>
            reg.genero &&
            reg.genero?.toLowerCase() !== "masculino" &&
            reg.genero?.toLowerCase() !== "femenino"
        ).length;

        // Count health conditions
        let withHealthConditions = 0;
        validRegistrations.forEach((reg) => {
          try {
            if (reg.condicionSalud) {
              let condicionSalud: string | CondicionSalud = reg.condicionSalud;

              // Si es string, intentar parsearlo como JSON
              if (typeof condicionSalud === "string") {
                try {
                  condicionSalud = JSON.parse(condicionSalud) as CondicionSalud;
                } catch (e) {
                  // Si no es un JSON válido, considerar cualquier string como condición de salud
                  withHealthConditions++;
                  return;
                }
              }

              // Verificar si es un objeto y tiene las propiedades esperadas
              if (
                typeof condicionSalud === "object" &&
                condicionSalud !== null
              ) {
                if (
                  condicionSalud.tieneAlergias === true ||
                  condicionSalud.tomaMedicamentos === true ||
                  condicionSalud.tieneProblemasSalud === true
                ) {
                  withHealthConditions++;
                }
              } else {
                // Si existe condicionSalud pero no es un objeto con formato esperado, contarlo
                withHealthConditions++;
              }
            }
          } catch (error) {
            console.error("Error al procesar condicionSalud:", error, reg.id);
          }
        });

        // Count jersey sizes
        const jerseySizes: JerseySize = {
          xs: 0,
          s: 0,
          m: 0,
          l: 0,
          xl: 0,
          xxl: 0,
        };

        validRegistrations.forEach((reg) => {
          if (reg.talleRemera) {
            const size = reg.talleRemera.toLowerCase() as keyof JerseySize;
            if (jerseySizes.hasOwnProperty(size)) {
              jerseySizes[size]++;
            }
          }
        });

        // Group registrations by day, incluyendo todas las inscripciones
        const registrationsByDay: Record<
          string,
          { total: number; rejected: number }
        > = {};

        // Ordenar todas las inscripciones por fecha para asegurar que mostramos desde la primera
        const sortedRegistrations = [...registrationsData].sort(
          (a, b) => a.fechaInscripcion.getTime() - b.fechaInscripcion.getTime()
        );

        // Primero, inicializar todas las fechas entre la primera y la última inscripción
        if (sortedRegistrations.length > 0) {
          const firstDate = new Date(sortedRegistrations[0].fechaInscripcion);
          const lastDate = new Date(
            sortedRegistrations[sortedRegistrations.length - 1].fechaInscripcion
          );

          // Crear un array con todas las fechas entre la primera y última inscripción
          const currentDate = new Date(firstDate);
          while (currentDate <= lastDate) {
            const dateStr = currentDate.toLocaleDateString();
            registrationsByDay[dateStr] = { total: 0, rejected: 0 };
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }

        // Luego, contar las inscripciones por día
        registrationsData.forEach((reg) => {
          try {
            if (reg.fechaInscripcion) {
              const date = reg.fechaInscripcion.toLocaleDateString();

              // Inicializar el día si aún no existe
              if (!registrationsByDay[date]) {
                registrationsByDay[date] = { total: 0, rejected: 0 };
              }

              // Incrementar contadores
              registrationsByDay[date].total++;

              // Si es rechazado, incrementar contador de rechazados
              if (reg.estado === "rechazado") {
                registrationsByDay[date].rejected++;
              }
            }
          } catch (error) {
            console.error("Error al procesar fecha:", error);
          }
        });

        // Convert to array for chart, ordenado por fecha
        const registrationsByDayArray = Object.entries(registrationsByDay)
          .map(([date, counts]) => ({
            date,
            total: counts.total,
            rejected: counts.rejected,
          }))
          .sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );

        setStats({
          totalRegistrations: registrationsData.length,
          validRegistrations: validRegistrations.length,
          maleCount,
          femaleCount,
          otherCount,
          withHealthConditions,
          jerseySize: jerseySizes,
          registrationsByDay: registrationsByDayArray,
        });
      } catch (error) {
        console.error("Error fetching registrations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, []);

  // Verificar si hay datos antes de crear gráficos
  const hasRegistrations = stats.validRegistrations > 0;

  const genderData: ChartDataItem[] = [
    { name: "Masculino", value: stats.maleCount },
    { name: "Femenino", value: stats.femaleCount },
    { name: "Otro", value: stats.otherCount },
  ].filter((item) => item.value > 0); // Solo incluir valores positivos

  const jerseySizeData: ChartDataItem[] = Object.entries(stats.jerseySize)
    .map(([size, count]) => ({
      name: size.toUpperCase(),
      value: count,
    }))
    .filter((item) => item.value > 0); // Solo incluir valores positivos

  const COLORS = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff8042",
    "#0088FE",
    "#00C49F",
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-pink-500" />
          <p className="text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Añadir una referencia aquí para el botón de volver arriba */}
  <div ref={topRef} className="flex flex-col items-center justify-center mt-32 mb-10 px-4">
  <h1 className="text-3xl font-bold tracking-tight text-center">
    Panel de Administración
  </h1>
</div>

      <div className="flex justify-between items-center">
        <Link href="/">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" /> Volver al inicio
          </Button>
        </Link>
      </div>








      

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inscripciones Activas
            </CardTitle>
            <Users className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.validRegistrations}</div>
            <p className="text-xs text-muted-foreground">
              de {eventSettings?.cupoMaximo || 300} cupos disponibles (
              {Math.round(
                (stats.validRegistrations /
                  (eventSettings?.cupoMaximo || 300)) *
                  100
              )}
              %)
            </p>
            <div className="mt-2 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-violet-500 rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    (stats.validRegistrations /
                      (eventSettings?.cupoMaximo || 300)) *
                      100
                  )}%`,
                }}
              ></div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Con Condiciones Médicas
            </CardTitle>
            <Calendar className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.withHealthConditions}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.validRegistrations > 0
                ? `${(
                    (stats.withHealthConditions / stats.validRegistrations) *
                    100
                  ).toFixed(1)}% del total`
                : "0% del total"}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Talle más solicitado
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.entries(stats.jerseySize)
                .reduce((a, b) => (a[1] > b[1] ? a : b), [null, 0])[0]
                ?.toUpperCase() || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.max(...Object.values(stats.jerseySize))} remeras
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cupos Disponibles
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(eventSettings?.cupoMaximo || 300) - stats.validRegistrations}
            </div>
            <p className="text-xs text-muted-foreground">
              {(
                (((eventSettings?.cupoMaximo || 300) -
                  stats.validRegistrations) /
                  (eventSettings?.cupoMaximo || 300)) *
                100
              ).toFixed(1)}
              % disponible
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de línea para inscripciones recientes */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>Inscripciones Recientes</CardTitle>
          <CardDescription>
            Tendencia de inscripciones en los últimos 14 días
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {hasRegistrations ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={stats.registrationsByDay}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Inscripciones"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-full">
                <p className="text-muted-foreground">
                  No hay datos suficientes para mostrar
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Botón para volver arriba (fijo en la parte inferior derecha) */}
      <div className="fixed bottom-8 right-8">
        <Button
          onClick={scrollToTop}
          variant="secondary"
          size="icon"
          className="rounded-full shadow-lg hover:shadow-xl bg-pink-500 hover:bg-pink-600 text-white"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Inscripciones Recientes</CardTitle>
            <CardDescription>Últimos 14 días</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {hasRegistrations && stats.registrationsByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.registrationsByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis allowDecimals={false} />

                  <Bar
                    dataKey="count"
                    name="Inscripciones"
                    fill="url(#colorGradient)"
                    radius={[4, 4, 0, 0]}
                  />
                  <defs>
                    <linearGradient
                      id="colorGradient"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">
                  No hay datos de inscripciones recientes
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="gender" className="shadow-sm">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="gender">Distribución por Género</TabsTrigger>
            <TabsTrigger value="jerseySize">Talles de Remera</TabsTrigger>
          </TabsList>
          <TabsContent value="gender" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Género</CardTitle>
                <CardDescription>
                  Distribución de participantes según género
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {genderData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genderData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {genderData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [
                          `${value} participantes`,
                          "Cantidad",
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">
                      No hay datos de género disponibles
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="jerseySize" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Talle de Remera</CardTitle>
                <CardDescription>Cantidad de remeras por talle</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {jerseySizeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={jerseySizeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip
                        formatter={(value) => [`${value} remeras`, "Cantidad"]}
                      />
                      <Bar
                        dataKey="value"
                        fill="url(#colorGradient2)"
                        radius={[4, 4, 0, 0]}
                      />
                      <defs>
                        <linearGradient
                          id="colorGradient2"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">
                      No hay datos de talles disponibles
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
