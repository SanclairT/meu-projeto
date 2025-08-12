"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Eye,
  EyeOff,
  DollarSign,
  TrendingUp,
  Clock,
  Settings,
  Download,
  Search,
  Plus,
  Check,
  X,
  Trash2,
  LogOut,
  FileText,
  UserPlus,
  Shield,
  Mail,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import { ThemeToggle } from "@/components/theme-toggle"
import { Notifications } from "@/components/notifications"
import { AuditLog } from "@/components/audit-log"
import { TaxCalculator } from "@/components/tax-calculator"
import { CommissionEmailTemplate } from "@/components/commission-email-template"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts"

import {
  generateVendasPDF,
  generateMarketingPDF,
  generateCompletePDF,
  generateCommissionPDF,
} from "@/lib/pdf-generator"
import { DatePicker } from "@/components/date-picker"
import { EditVendaModal } from "@/components/edit-venda-modal"
import { MarketingCommissionModal } from "@/components/marketing-commission-modal"
import { securityManager } from "@/lib/security"
import { ExcelExporter } from "@/lib/excel-exporter"

// Types
interface Venda {
  id: string
  tipo: "venda"
  pedido: string
  nota?: string
  cliente: string
  desc?: string
  valor: number
  pag: string
  parc: number
  vend: string
  status: "pendente" | "aprovado"
  created: string
  boletos?: string[]
}

interface Marketing {
  id: string
  tipo: "mark"
  pedido: string
  cliente: string
  mes: string
  pacote: "bronze" | "prata" | "ouro" | "diamante"
  valor: number
  vend: string
  status: "pendente" | "aprovado"
  created: string
  mesReferencia?: Date
  comissaoConfig?: {
    percentage: number
    vendedoras: string[]
  }
}

interface Config {
  commVenda: number
  markM1: number
  markCont: number
  monthlySalesGoal: number
  pacoteValues: {
    bronze: number
    prata: number
    ouro: number
    diamante: number
  }
}

interface ERPUser {
  email: string
  pass: string
  name: string
  role: "admin" | "financeiro" | "vendedora"
}

interface Notification {
  id: string
  type: "venda" | "marketing"
  message: string
  timestamp: string
  read: boolean
  vendedora: string
  valor: number
}

const defaultUsers = [
  { email: "admin@local", pass: "123456", name: "Admin", role: "admin" as const },
  { email: "financeiro@local", pass: "123456", name: "Financeiro", role: "financeiro" as const },
  { email: "mayra@local", pass: "123456", name: "Mayra", role: "vendedora" as const },
  { email: "liliane@local", pass: "123456", name: "Liliane", role: "vendedora" as const },
]

const defaultPacoteValues = {
  bronze: 120,
  prata: 220,
  ouro: 420,
  diamante: 720,
}

export default function ERPSystem() {
  const [currentUser, setCurrentUser] = useState<ERPUser | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [vendas, setVendas] = useState<Venda[]>([])
  const [marketing, setMarketing] = useState<Marketing[]>([])
  const [config, setConfig] = useState<Config>({
    commVenda: 3,
    markM1: 10,
    markCont: 5,
    monthlySalesGoal: 5000, // Default goal
    pacoteValues: defaultPacoteValues,
  })
  const [searchVendas, setSearchVendas] = useState("")
  const [searchMarketing, setSearchMarketing] = useState("")
  const [users, setUsers] = useState<ERPUser[]>(defaultUsers)
  const [mesReferencia, setMesReferencia] = useState<Date>()
  const [dashboardFilterMonth, setDashboardFilterMonth] = useState<Date | undefined>(new Date())
  const [showEmailPreview, setShowEmailPreview] = useState(false)
  const [emailPreviewContent, setEmailPreviewContent] = useState<{
    salespersonName: string
    reportData: any[]
    totalCommission: number
    totalSalesValue: number
    commissionPercentage: number
  } | null>(null)

  // Form states
  const [vendaForm, setVendaForm] = useState({
    pedido: "",
    nota: "",
    cliente: "",
    desc: "",
    valor: "",
    pag: "PIX",
    parc: "1",
    boletos: [] as string[],
  })
  const [marketingForm, setMarketingForm] = useState({
    pedido: "",
    cliente: "",
    mes: "",
    pacote: "bronze",
    comissaoConfig: null as { percentage: number; vendedoras: string[] } | null,
  })
  const [userForm, setUserForm] = useState({
    email: "",
    pass: "",
    name: "",
    role: "vendedora",
  })

  // Load data on mount
  useEffect(() => {
    securityManager.startAutoBackup()

    const savedUser = localStorage.getItem("erp_user")
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser))
    }

    const savedUsers = localStorage.getItem("erp_users")
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers))
    } else {
      localStorage.setItem("erp_users", JSON.stringify(defaultUsers))
    }

    const savedVendas = localStorage.getItem("erp_vendas")
    if (savedVendas) {
      setVendas(JSON.parse(savedVendas))
    } else {
      const seedVendas: Venda[] = [
        {
          id: generateId(),
          tipo: "venda",
          pedido: "000101",
          nota: "0101",
          cliente: "Cliente A",
          desc: "Produto X",
          valor: 350.0,
          pag: "PIX",
          parc: 1,
          vend: "Mayra",
          status: "aprovado",
          created: new Date(2025, 6, 15).toISOString(), // Julho
        },
        {
          id: generateId(),
          tipo: "venda",
          pedido: "000102",
          nota: "0102",
          cliente: "Cliente B",
          desc: "Produto Y",
          valor: 1200.0,
          pag: "Cartão",
          parc: 6,
          vend: "Liliane",
          status: "pendente",
          created: new Date(2025, 7, 1).toISOString(), // Agosto
        },
        {
          id: generateId(),
          tipo: "venda",
          pedido: "000103",
          nota: "0103",
          cliente: "Cliente C",
          desc: "Serviço Z",
          valor: 800.0,
          pag: "PIX",
          parc: 1,
          vend: "Mayra",
          status: "aprovado",
          created: new Date(2025, 7, 10).toISOString(), // Agosto
        },
        {
          id: generateId(),
          tipo: "venda",
          pedido: "000104",
          cliente: "Cliente D",
          desc: "Consultoria",
          valor: 2500.0,
          pag: "Fatura unificada",
          parc: 1,
          vend: "Liliane",
          status: "aprovado",
          created: new Date(2025, 7, 20).toISOString(), // Agosto
          boletos: ["link1.com/boleto1", "link2.com/boleto2"],
        },
      ]
      setVendas(seedVendas)
      localStorage.setItem("erp_vendas", JSON.stringify(seedVendas))
    }

    const savedMarketing = localStorage.getItem("erp_mark")
    if (savedMarketing) {
      setMarketing(JSON.parse(savedMarketing))
    } else {
      const seedMarketing: Marketing[] = [
        {
          id: generateId(),
          tipo: "mark",
          pedido: "000201",
          cliente: "Cliente M",
          pacote: "ouro",
          valor: defaultPacoteValues.ouro,
          vend: "Mayra",
          mes: "2025-07",
          status: "pendente",
          created: new Date(2025, 6, 5).toISOString(), // Julho
        },
        {
          id: generateId(),
          tipo: "mark",
          pedido: "000202",
          cliente: "Cliente N",
          pacote: "prata",
          valor: defaultPacoteValues.prata,
          vend: "Liliane",
          mes: "2025-08",
          status: "aprovado",
          created: new Date(2025, 7, 12).toISOString(), // Agosto
          comissaoConfig: { percentage: 5, vendedoras: ["Liliane", "Mayra"] },
        },
      ]
      setMarketing(seedMarketing)
      localStorage.setItem("erp_mark", JSON.stringify(seedMarketing))
    }

    const savedConfig = localStorage.getItem("erp_cfg")
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig))
    }
    // Initialize pacoteValues in config if not present
    setConfig((prevConfig) => ({
      ...prevConfig,
      pacoteValues: prevConfig.pacoteValues || defaultPacoteValues,
    }))
  }, [])

  const generateId = () => Math.random().toString(36).slice(2, 10)

  const addNotification = (type: "venda" | "marketing", vendedora: string, valor: number, cliente: string) => {
    const notification: Notification = {
      id: generateId(),
      type,
      message: `Nova ${type} criada por ${vendedora}: ${cliente} - ${formatCurrency(valor)}`,
      timestamp: new Date().toISOString(),
      read: false,
      vendedora,
      valor,
    }

    const existingNotifications = JSON.parse(localStorage.getItem("erp_notifications") || "[]")
    const updatedNotifications = [notification, ...existingNotifications].slice(0, 50)
    localStorage.setItem("erp_notifications", JSON.stringify(updatedNotifications))

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "erp_notifications",
        newValue: JSON.stringify(updatedNotifications),
      }),
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const user = users.find((u) => u.email === email && u.pass === password)

    if (!user) {
      setLoginError("Credenciais inválidas. Verifique seu e-mail e senha.")
      return
    }

    const userData: ERPUser = { email: user.email, pass: user.pass, name: user.name, role: user.role }
    setCurrentUser(userData)
    localStorage.setItem("erp_user", JSON.stringify(userData))
    setLoginError("")

    securityManager.logAction(user.name, "LOGIN", "USER", user.email, [], `Login realizado com sucesso`)
  }

  const handleLogout = () => {
    if (currentUser) {
      securityManager.logAction(currentUser.name, "LOGOUT", "USER", currentUser.email, [], `Logout realizado`)
    }
    setCurrentUser(null)
    localStorage.removeItem("erp_user")
  }

  const saveVendas = (newVendas: Venda[]) => {
    setVendas(newVendas)
    localStorage.setItem("erp_vendas", JSON.stringify(newVendas))
  }

  const saveMarketing = (newMarketing: Marketing[]) => {
    setMarketing(newMarketing)
    localStorage.setItem("erp_mark", JSON.stringify(newMarketing))
  }

  const handleEditVenda = (updatedVenda: Venda) => {
    if (currentUser?.role !== "financeiro" && currentUser?.role !== "admin") {
      alert("Permissão negada.")
      return
    }

    const originalVenda = vendas.find((v) => v.id === updatedVenda.id)
    if (!originalVenda) return

    const changes = []
    if (originalVenda.nota !== updatedVenda.nota) {
      changes.push({
        field: "nota",
        oldValue: originalVenda.nota || "vazio",
        newValue: updatedVenda.nota || "vazio",
      })
    }
    if (JSON.stringify(originalVenda.boletos) !== JSON.stringify(updatedVenda.boletos)) {
      changes.push({
        field: "boletos",
        oldValue: originalVenda.boletos?.join(", ") || "vazio",
        newValue: updatedVenda.boletos?.join(", ") || "vazio",
      })
    }

    const updatedVendas = vendas.map((v) => (v.id === updatedVenda.id ? updatedVenda : v))
    saveVendas(updatedVendas)

    securityManager.logAction(
      currentUser.name,
      "UPDATE",
      "VENDA",
      updatedVenda.id,
      changes,
      `Venda ${updatedVenda.pedido} editada`,
    )

    alert("Venda atualizada com sucesso!")
  }

  const handleVendaSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (vendaForm.pedido.length !== 6) {
      alert("Nº do pedido deve ter 6 dígitos.")
      return
    }

    if (vendaForm.nota && vendaForm.nota.length !== 4) {
      alert("Nota fiscal, se preenchida, deve ter 4 dígitos.")
      return
    }

    if (Number(vendaForm.valor) <= 0) {
      alert("Valor deve ser maior que zero.")
      return
    }

    const novaVenda: Venda = {
      id: generateId(),
      tipo: "venda",
      pedido: vendaForm.pedido,
      nota: vendaForm.nota || undefined,
      cliente: vendaForm.cliente,
      desc: vendaForm.desc || undefined,
      valor: Number(vendaForm.valor),
      pag: vendaForm.pag,
      parc: Number(vendaForm.parc),
      vend: currentUser?.name || "Vendedora", // Auto-assign salesperson
      status: currentUser?.role === "vendedora" ? "pendente" : "aprovado",
      created: new Date().toISOString(),
      boletos: vendaForm.pag === "Fatura unificada" ? vendaForm.boletos?.filter((b) => b.trim() !== "") : undefined,
    }

    saveVendas([...vendas, novaVenda])

    securityManager.logAction(
      currentUser?.name || "Sistema",
      "CREATE",
      "VENDA",
      novaVenda.id,
      [],
      `Nova venda criada: ${novaVenda.pedido} - ${novaVenda.cliente}`,
    )

    if (currentUser?.role === "vendedora") {
      addNotification("venda", novaVenda.vend, Number(vendaForm.valor), novaVenda.cliente)
    }

    setVendaForm({
      pedido: "",
      nota: "",
      cliente: "",
      desc: "",
      valor: "",
      pag: "PIX",
      parc: "1",
      boletos: [],
    })
    alert("Registro salvo com sucesso!")
  }

  const handleMarketingSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (marketingForm.pedido.length !== 6) {
      alert("Nº do pedido deve ter 6 dígitos.")
      return
    }

    const novoMarketing: Marketing = {
      id: generateId(),
      tipo: "mark",
      pedido: marketingForm.pedido,
      cliente: marketingForm.cliente,
      mes: mesReferencia ? mesReferencia.toISOString().slice(0, 7) : "", // Format YYYY-MM
      pacote: marketingForm.pacote as keyof typeof config.pacoteValues,
      valor: config.pacoteValues[marketingForm.pacote as keyof typeof config.pacoteValues],
      vend: currentUser?.name || "Vendedora", // Auto-assign salesperson
      status: currentUser?.role === "vendedora" ? "pendente" : "aprovado",
      created: new Date().toISOString(),
      mesReferencia: mesReferencia,
      comissaoConfig: marketingForm.comissaoConfig,
    }

    saveMarketing([...marketing, novoMarketing])

    securityManager.logAction(
      currentUser?.name || "Sistema",
      "CREATE",
      "MARKETING",
      novoMarketing.id,
      [],
      `Novo marketing criado: ${novoMarketing.pedido} - ${novoMarketing.cliente}`,
    )

    if (currentUser?.role === "vendedora") {
      addNotification("marketing", novoMarketing.vend, novoMarketing.valor, novoMarketing.cliente)
    }

    setMarketingForm({
      pedido: "",
      cliente: "",
      mes: "",
      pacote: "bronze",
      comissaoConfig: null,
    })
    setMesReferencia(undefined) // Clear date picker
    alert("Pacote salvo com sucesso!")
  }

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!userForm.email || !userForm.pass || !userForm.name) {
      alert("Todos os campos são obrigatórios.")
      return
    }

    if (users.find((u) => u.email === userForm.email)) {
      alert("Email já cadastrado.")
      return
    }

    const passwordValidation = securityManager.validatePassword(userForm.pass)
    if (!passwordValidation.isValid) {
      alert(`Senha não atende aos critérios:\n${passwordValidation.errors.join("\n")}`)
      return
    }

    const newUser: ERPUser = {
      email: userForm.email,
      pass: userForm.pass,
      name: userForm.name,
      role: userForm.role as "admin" | "financeiro" | "vendedora",
    }

    const updatedUsers = [...users, newUser]
    setUsers(updatedUsers)
    localStorage.setItem("erp_users", JSON.stringify(updatedUsers))

    securityManager.logAction(
      currentUser?.name || "Sistema",
      "CREATE",
      "USER",
      newUser.email,
      [],
      `Novo usuário cadastrado: ${newUser.name} (${newUser.role})`,
    )

    setUserForm({
      email: "",
      pass: "",
      name: "",
      role: "vendedora",
    })

    alert("Usuário cadastrado com sucesso!")
  }

  const approveVenda = (id: string) => {
    if (currentUser?.role !== "admin" && currentUser?.role !== "financeiro") {
      alert("Permissão negada.")
      return
    }

    const venda = vendas.find((v) => v.id === id)
    if (!venda) return

    const updatedVendas = vendas.map((v) => (v.id === id ? { ...v, status: "aprovado" as const } : v))
    saveVendas(updatedVendas)

    securityManager.logAction(
      currentUser.name,
      "UPDATE",
      "VENDA",
      id,
      [{ field: "status", oldValue: "pendente", newValue: "aprovado" }],
      `Venda ${venda.pedido} aprovada`,
    )
  }

  const approveMarketing = (id: string) => {
    if (currentUser?.role !== "admin" && currentUser?.role !== "financeiro") {
      alert("Permissão negada.")
      return
    }

    const item = marketing.find((m) => m.id === id)
    if (!item) return

    const updatedMarketing = marketing.map((m) => (m.id === id ? { ...m, status: "aprovado" as const } : m))
    saveMarketing(updatedMarketing)

    securityManager.logAction(
      currentUser.name,
      "UPDATE",
      "MARKETING",
      id,
      [{ field: "status", oldValue: "pendente", newValue: "aprovado" }],
      `Marketing ${item.pedido} aprovado`,
    )
  }

  const deleteVenda = (id: string) => {
    if (!confirm("Confirma exclusão?")) return

    const venda = vendas.find((v) => v.id === id)
    if (!venda) return

    saveVendas(vendas.filter((v) => v.id !== id))

    securityManager.logAction(
      currentUser?.name || "Sistema",
      "DELETE",
      "VENDA",
      id,
      [],
      `Venda ${venda.pedido} excluída`,
    )
  }

  const deleteMarketing = (id: string) => {
    if (!confirm("Confirma exclusão?")) return

    const item = marketing.find((m) => m.id === id)
    if (!item) return

    saveMarketing(marketing.filter((m) => m.id !== id))

    securityManager.logAction(
      currentUser?.name || "Sistema",
      "DELETE",
      "MARKETING",
      id,
      [],
      `Marketing ${item.pedido} excluído`,
    )
  }

  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) {
      alert("Sem dados para exportar.")
      return
    }

    const keys = Object.keys(data[0])
    const csv = [
      keys.join(","),
      ...data.map((row) => keys.map((key) => `"${String(row[key] || "").replace(/"/g, '""')}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportVendasPDF = () => {
    const doc = generateVendasPDF(vendas)
    doc.save(`vendas_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  const exportMarketingPDF = () => {
    const doc = generateMarketingPDF(marketing)
    doc.save(`marketing_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  const exportCompletePDF = () => {
    const doc = generateCompletePDF(vendas, marketing)
    doc.save(`relatorio_completo_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  const getCommissionData = () => {
    const commissionData: any[] = []

    vendas.forEach((venda) => {
      if (venda.status === "aprovado") {
        commissionData.push({
          type: "venda",
          pedido: venda.pedido,
          cliente: venda.cliente,
          valor: venda.valor,
          comissao: venda.valor * (config.commVenda / 100),
          vendedora: venda.vend,
        })
      }
    })

    marketing.forEach((item) => {
      if (item.status === "aprovado") {
        const comissaoMarketing = getComissaoMarketing(item)
        commissionData.push({
          type: "marketing",
          pedido: item.pedido,
          cliente: item.cliente,
          valor: item.valor,
          comissao: comissaoMarketing.total,
          vendedora: item.vend,
        })
      }
    })

    return commissionData
  }

  const exportCommissionReportPDF = () => {
    const commissionData = getCommissionData()
    const doc = generateCommissionPDF(commissionData, config)
    doc.save(`relatorio_comissoes_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  const exportVendasExcel = () => {
    const data = vendas.map((v) => ({
      Pedido: v.pedido,
      Cliente: v.cliente,
      Valor: v.valor,
      Vendedora: v.vend,
      Status: v.status,
      Data: new Date(v.created).toLocaleDateString("pt-BR"),
      Comissão: v.valor * (config.commVenda / 100),
    }))
    ExcelExporter.exportToExcel(data, "vendas", "Vendas")
  }

  const exportMarketingExcel = () => {
    const data = marketing.map((m) => ({
      Pedido: m.pedido,
      Cliente: m.cliente,
      Pacote: m.pacote,
      Valor: m.valor,
      Vendedora: m.vend,
      Status: m.status,
      Data: new Date(m.created).toLocaleDateString("pt-BR"),
    }))
    ExcelExporter.exportToExcel(data, "marketing", "Marketing")
  }

  const exportCompleteExcel = () => {
    ExcelExporter.exportCommissionReport(vendas, marketing, config)
  }

  // Dashboard Data Filtering
  const filterDataByMonth = (data: (Venda | Marketing)[], dateFilter?: Date) => {
    if (!dateFilter) return data
    const filterMonth = dateFilter.getMonth()
    const filterYear = dateFilter.getFullYear()
    return data.filter((item) => {
      const itemDate = new Date(item.created)
      return itemDate.getMonth() === filterMonth && itemDate.getFullYear() === filterYear
    })
  }

  const filteredVendasDashboard = filterDataByMonth(vendas, dashboardFilterMonth)
  const filteredMarketingDashboard = filterDataByMonth(marketing, dashboardFilterMonth)

  // Calculations for Dashboard
  const totalVendasDashboard = filteredVendasDashboard.reduce((sum, v) => sum + v.valor, 0)
  const totalComissaoDashboard = filteredVendasDashboard
    .filter((v) => v.status === "aprovado")
    .reduce((sum, v) => sum + v.valor * (config.commVenda / 100), 0)
  const pendenciasCount =
    vendas.filter((v) => v.status === "pendente").length + marketing.filter((m) => m.status === "pendente").length

  const getTicketMedio = () => {
    if (filteredVendasDashboard.length === 0) return 0
    return totalVendasDashboard / filteredVendasDashboard.length
  }

  const getVendasPorMes = () => {
    const vendasPorMes: { [key: string]: number } = {}
    filteredVendasDashboard.forEach((venda) => {
      const mes = new Date(venda.created).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
      vendasPorMes[mes] = (vendasPorMes[mes] || 0) + venda.valor
    })
    const data = Object.entries(vendasPorMes)
      .map(([mes, valor]) => ({ mes, valor }))
      .slice(-6)
    return data.length > 0 ? data : [{ mes: "Sem dados", valor: 0 }]
  }

  const getComissaoPorVendedora = () => {
    const comissaoPorVend: { [key: string]: number } = {}
    filteredVendasDashboard
      .filter((v) => v.status === "aprovado")
      .forEach((venda) => {
        const comissao = venda.valor * (config.commVenda / 100)
        comissaoPorVend[venda.vend] = (comissaoPorVend[venda.vend] || 0) + comissao
      })
    const data = Object.entries(comissaoPorVend).map(([vendedora, comissao]) => ({ vendedora, comissao }))
    return data.length > 0 ? data : [{ vendedora: "Sem dados", comissao: 0 }]
  }

  const getStatusDistribution = () => {
    const aprovadas = filteredVendasDashboard.filter((v) => v.status === "aprovado").length
    const pendentes = filteredVendasDashboard.filter((v) => v.status === "pendente").length
    if (aprovadas === 0 && pendentes === 0) {
      return [{ name: "Sem dados", value: 1, fill: "hsl(var(--muted))" }]
    }
    return [
      { name: "Aprovadas", value: aprovadas, fill: "hsl(var(--chart-1))" },
      { name: "Pendentes", value: pendentes, fill: "hsl(var(--chart-2))" },
    ]
  }

  const getPacotesMarketing = () => {
    const pacoteCount: { [key: string]: number } = {}
    filteredMarketingDashboard.forEach((item) => {
      pacoteCount[item.pacote] = (pacoteCount[item.pacote] || 0) + 1
    })
    const data = Object.entries(pacoteCount).map(([pacote, count]) => ({
      pacote: pacote.charAt(0).toUpperCase() + pacote.slice(1),
      count,
      valor: config.pacoteValues[pacote as keyof typeof config.pacoteValues] * count,
    }))
    return data.length > 0 ? data : [{ pacote: "Sem dados", count: 0, valor: 0 }]
  }

  const getPerformanceMensal = () => {
    const performancePorMes: { [key: string]: { vendas: number; marketing: number } } = {}

    filteredVendasDashboard.forEach((venda) => {
      const mes = new Date(venda.created).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
      if (!performancePorMes[mes]) performancePorMes[mes] = { vendas: 0, marketing: 0 }
      performancePorMes[mes].vendas += venda.valor
    })

    filteredMarketingDashboard.forEach((item) => {
      const mes = new Date(item.created).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
      if (!performancePorMes[mes]) performancePorMes[mes] = { vendas: 0, marketing: 0 }
      performancePorMes[mes].marketing += item.valor
    })

    const data = Object.entries(performancePorMes)
      .map(([mes, data]) => ({
        mes,
        vendas: data.vendas,
        marketing: data.marketing,
        total: data.vendas + data.marketing,
      }))
      .slice(-6)
    return data.length > 0 ? data : [{ mes: "Sem dados", vendas: 0, marketing: 0, total: 0 }]
  }

  const getTendenciaVendas = () => {
    const vendasPorMes = getVendasPorMes()
    if (vendasPorMes.length < 2) return vendasPorMes

    const tendencia = vendasPorMes.map((item, index) => {
      if (index === 0) return { ...item, tendencia: item.valor, crescimento: "0" }

      const anterior = vendasPorMes[index - 1].valor
      const crescimento = anterior > 0 ? ((item.valor - anterior) / anterior) * 100 : 0

      return {
        ...item,
        tendencia: item.valor,
        crescimento: crescimento.toFixed(1),
      }
    })
    return tendencia
  }

  const getSalesGoalProgress = () => {
    const currentMonthSales = filteredVendasDashboard.reduce((sum, v) => sum + v.valor, 0)
    const progress = (currentMonthSales / config.monthlySalesGoal) * 100
    return {
      current: currentMonthSales,
      goal: config.monthlySalesGoal,
      progress: Math.min(100, progress),
      achieved: currentMonthSales >= config.monthlySalesGoal,
    }
  }

  const getPaymentStatusSummary = () => {
    const pixCount = filteredVendasDashboard.filter((v) => v.pag === "PIX").length
    const cardCount = filteredVendasDashboard.filter((v) => v.pag === "Cartão").length
    const unifiedInvoiceCount = filteredVendasDashboard.filter((v) => v.pag === "Fatura unificada").length
    const totalPayments = pixCount + cardCount + unifiedInvoiceCount

    return [
      { name: "PIX", value: pixCount, fill: "hsl(var(--chart-1))" },
      { name: "Cartão", value: cardCount, fill: "hsl(var(--chart-2))" },
      { name: "Fatura Unificada", value: unifiedInvoiceCount, fill: "hsl(var(--chart-3))" },
    ].filter((item) => item.value > 0 || totalPayments === 0) // Show all if no data, otherwise filter 0 values
  }

  // Filtered data for tables (based on search and user role)
  const filteredVendas = vendas.filter(
    (v) =>
      !searchVendas || v.cliente.toLowerCase().includes(searchVendas.toLowerCase()) || v.pedido.includes(searchVendas),
  )

  const filteredMarketing = marketing.filter(
    (m) =>
      !searchMarketing ||
      m.cliente.toLowerCase().includes(searchMarketing.toLowerCase()) ||
      m.pedido.includes(searchMarketing),
  )

  const pendentesVendas = vendas.filter((v) => v.status === "pendente")
  const pendentesMarketing = marketing.filter((m) => m.status === "pendente")

  const getAvailableTabs = () => {
    if (currentUser?.role === "admin") {
      return ["dashboard", "pendencias", "relatorios", "config", "auditoria"]
    } else if (currentUser?.role === "financeiro") {
      return ["dashboard", "vendas", "marketing", "pendencias", "relatorios", "calculadora", "auditoria"]
    } else {
      return ["dashboard", "vendas", "marketing", "relatorios"]
    }
  }

  const getComissaoMarketing = (item: Marketing) => {
    if (item.comissaoConfig) {
      const comissaoTotal = item.valor * (item.comissaoConfig.percentage / 100)
      const comissaoPorVendedora = comissaoTotal / item.comissaoConfig.vendedoras.length
      return { total: comissaoTotal, porVendedora: comissaoPorVendedora, vendedoras: item.comissaoConfig.vendedoras }
    }
    // Default commission if no specific config
    return {
      total: item.valor * (config.markM1 / 100),
      porVendedora: item.valor * (config.markM1 / 100),
      vendedoras: [item.vend],
    }
  }

  const filteredVendasByUser =
    currentUser?.role === "vendedora" ? filteredVendas.filter((v) => v.vend === currentUser.name) : filteredVendas

  const filteredMarketingByUser =
    currentUser?.role === "vendedora" ? filteredMarketing.filter((m) => m.vend === currentUser.name) : filteredMarketing

  const handleGenerateCommissionEmail = (salesperson?: ERPUser) => {
    const targetUser = salesperson || currentUser
    if (!targetUser) return

    const userVendas = vendas.filter((v) => v.vend === targetUser.name && v.status === "aprovado")
    const userMarketing = marketing.filter(
      (m) => m.status === "aprovado" && m.comissaoConfig?.vendedoras.includes(targetUser.name),
    )

    const reportData: any[] = []
    let totalSalesValue = 0
    let totalCommission = 0

    userVendas.forEach((venda) => {
      const commission = venda.valor * (config.commVenda / 100)
      reportData.push({
        type: "venda",
        pedido: venda.pedido,
        cliente: venda.cliente,
        valor: venda.valor,
        comissao: commission,
        status: venda.status,
        data: new Date(venda.created).toLocaleDateString("pt-BR"),
        nota: venda.nota,
        parcelas: venda.parc,
        boletos: venda.boletos,
      })
      totalSalesValue += venda.valor
      totalCommission += commission
    })

    userMarketing.forEach((item) => {
      const marketingCommission = getComissaoMarketing(item)
      // If multiple salespersons, only add their share to their report
      const commissionForThisUser = marketingCommission.porVendedora // Already calculated per salesperson if split

      reportData.push({
        type: "marketing",
        pedido: item.pedido,
        cliente: item.cliente,
        valor: item.valor,
        comissao: commissionForThisUser,
        status: item.status,
        data: new Date(item.created).toLocaleDateString("pt-BR"),
        pacote: item.pacote,
      })
      totalSalesValue += item.valor // This is total value of marketing item, not just user's share
      totalCommission += commissionForThisUser
    })

    setEmailPreviewContent({
      salespersonName: targetUser.name,
      reportData,
      totalCommission,
      totalSalesValue,
      commissionPercentage: config.commVenda, // Using general sales commission for display
    })
    setShowEmailPreview(true)
  }

  const availableVendedorasForMarketing = users.filter((u) => u.role === "vendedora").map((u) => u.name)

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl rounded-xl border-none">
          <CardHeader className="text-center space-y-2 pt-8">
            <CardTitle className="text-3xl font-extrabold text-gray-900">Sistema ERP</CardTitle>
            <CardDescription className="text-gray-600 text-lg">Gestão Completa de Vendas e Marketing</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-8">
            <Card className="mb-6 bg-blue-50 border-blue-200 text-blue-800">
              <CardContent className="p-4 text-sm">
                <p className="font-semibold mb-2">Contas de teste disponíveis:</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs">admin@local</span>
                    <Badge variant="outline" className="text-xs">
                      Admin
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs">financeiro@local</span>
                    <Badge variant="outline" className="text-xs">
                      Financeiro
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs">mayra@local</span>
                    <Badge variant="outline" className="text-xs">
                      Vendedora
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs">liliane@local</span>
                    <Badge variant="outline" className="text-xs">
                      Vendedora
                    </Badge>
                  </div>
                  <p className="text-xs text-center mt-2 text-blue-600">
                    Senha padrão: <span className="font-mono">123456</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {loginError && (
              <Alert className="mb-4 border-red-400 bg-red-50 text-red-700">
                <AlertDescription className="text-sm">{loginError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <Label htmlFor="email" className="text-gray-700 font-medium text-sm">
                  E-mail
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@exemplo.com"
                  required
                  className="mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-gray-700 font-medium text-sm">
                  Senha
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className="pr-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:bg-transparent hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-xs text-gray-500">Primeira vez? Use uma conta de teste acima</div>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline"
                    onClick={() => alert("Para recuperar sua senha, entre em contato com o administrador do sistema.")}
                  >
                    Esqueceu sua senha?
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full py-3 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
              >
                Entrar no Sistema
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center mb-3">Recursos do sistema:</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  <span>Gestão de Vendas</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>Marketing</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  <span>Relatórios</span>
                </div>
                <div className="flex items-center gap-1">
                  <Settings className="h-3 w-3" />
                  <span>Dashboard</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const availableTabs = getAvailableTabs()
  const salesGoalProgress = getSalesGoalProgress()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <header className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold">ERP Sistema</h1>
              <p className="text-sm text-muted-foreground">Vendas • Marketing • Financeiro</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div>
                  <div className="font-medium">{currentUser.name}</div>
                  <div className="text-muted-foreground text-xs">{currentUser.role.toUpperCase()}</div>
                </div>
              </div>
              <Notifications userRole={currentUser.role} />
              <ThemeToggle />
              {(currentUser.role === "admin" || currentUser.role === "financeiro") && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportCompletePDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportCompleteExcel}>
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${availableTabs.length}, 1fr)` }}>
            {availableTabs.includes("dashboard") && <TabsTrigger value="dashboard">Dashboard</TabsTrigger>}
            {availableTabs.includes("vendas") && <TabsTrigger value="vendas">Vendas</TabsTrigger>}
            {availableTabs.includes("marketing") && <TabsTrigger value="marketing">Marketing</TabsTrigger>}
            {availableTabs.includes("pendencias") && <TabsTrigger value="pendencias">Pendências</TabsTrigger>}
            {availableTabs.includes("relatorios") && <TabsTrigger value="relatorios">Relatórios</TabsTrigger>}
            {availableTabs.includes("calculadora") && <TabsTrigger value="calculadora">Calculadora</TabsTrigger>}
            {availableTabs.includes("auditoria") && <TabsTrigger value="auditoria">Auditoria</TabsTrigger>}
            {availableTabs.includes("config") && <TabsTrigger value="config">Configurações</TabsTrigger>}
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {(currentUser.role === "admin" || currentUser.role === "financeiro") && (
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="dashboard-month-filter" className="text-sm font-medium text-blue-900">
                        Filtrar Dashboard:
                      </Label>
                      <DatePicker
                        date={dashboardFilterMonth}
                        onDateChange={setDashboardFilterMonth}
                        placeholder="Selecione o mês"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-700">
                      <Clock className="h-4 w-4" />
                      <span>
                        {dashboardFilterMonth
                          ? `Dados de ${dashboardFilterMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`
                          : "Todos os períodos"}
                      </span>
                    </div>
                    {dashboardFilterMonth && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDashboardFilterMonth(undefined)}
                        className="text-xs"
                      >
                        Limpar Filtro
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cards de Métricas */}
            <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Vendas</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl lg:text-2xl font-bold">{formatCurrency(totalVendasDashboard)}</div>
                  <p className="text-xs text-muted-foreground">+{filteredVendasDashboard.length} registros</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Comissão Total</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl lg:text-2xl font-bold">{formatCurrency(totalComissaoDashboard)}</div>
                  <p className="text-xs text-muted-foreground">
                    {totalVendasDashboard > 0 ? ((totalComissaoDashboard / totalVendasDashboard) * 100).toFixed(1) : 0}%
                    do total
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl lg:text-2xl font-bold">{formatCurrency(getTicketMedio())}</div>
                  <p className="text-xs text-muted-foreground">Por venda no período</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendências</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl lg:text-2xl font-bold text-orange-600">{pendenciasCount}</div>
                  <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
                </CardContent>
              </Card>

              {(currentUser.role === "admin" || currentUser.role === "financeiro") && (
                <>
                  <Card className="hover:shadow-md transition-shadow lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Meta de Vendas Mensal</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl lg:text-2xl font-bold">{formatCurrency(salesGoalProgress.current)}</div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Meta: {formatCurrency(salesGoalProgress.goal)} ({salesGoalProgress.progress.toFixed(1)}%)
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${
                            salesGoalProgress.achieved
                              ? "bg-gradient-to-r from-green-500 to-green-600"
                              : "bg-gradient-to-r from-blue-500 to-blue-600"
                          }`}
                          style={{ width: `${Math.min(100, salesGoalProgress.progress)}%` }}
                        ></div>
                      </div>
                      {salesGoalProgress.achieved && (
                        <p className="text-xs text-green-600 font-medium mt-1">🎉 Meta atingida!</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Formas de Pagamento</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <ChartContainer
                          config={{
                            PIX: { label: "PIX", color: "hsl(var(--chart-1))" },
                            Cartão: { label: "Cartão", color: "hsl(var(--chart-2))" },
                            "Fatura Unificada": { label: "Fatura Unificada", color: "hsl(var(--chart-3))" },
                          }}
                          className="h-[80px] w-[120px]"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={getPaymentStatusSummary()}
                                cx="50%"
                                cy="50%"
                                outerRadius={35}
                                dataKey="value"
                                labelLine={false}
                              >
                                {getPaymentStatusSummary().map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Pie>
                              <ChartTooltip
                                content={<ChartTooltipContent />}
                                formatter={(value: number, name: string) => [`${value} vendas`, name]}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                        <div className="flex-1 ml-4">
                          <div className="space-y-1">
                            {getPaymentStatusSummary().map((payment, index) => (
                              <div key={index} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payment.fill }}></div>
                                  <span>{payment.name}</span>
                                </div>
                                <span className="font-medium">{payment.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Gráficos com escalas corretas */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Gráfico de Vendas por Mês */}
              <Card>
                <CardHeader>
                  <CardTitle>Vendas por Mês</CardTitle>
                  <CardDescription>Evolução das vendas no período selecionado</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      valor: {
                        label: "Valor",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getVendasPorMes()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis
                          tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                          domain={["dataMin", "dataMax + 100"]}
                        />
                        <ChartTooltip
                          content={<ChartTooltipContent />}
                          formatter={(value: number) => [formatCurrency(value), "Vendas"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="valor"
                          stroke="var(--color-valor)"
                          strokeWidth={3}
                          dot={{ fill: "var(--color-valor)", strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Gráfico de Comissão por Vendedora */}
              <Card>
                <CardHeader>
                  <CardTitle>Comissão por Vendedora</CardTitle>
                  <CardDescription>Comissões acumuladas por vendedora no período selecionado</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      comissao: {
                        label: "Comissão",
                        color: "hsl(var(--chart-2))",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getComissaoPorVendedora()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="vendedora" />
                        <YAxis tickFormatter={(value) => `R$ ${value.toFixed(0)}`} domain={[0, "dataMax + 50"]} />
                        <ChartTooltip
                          content={<ChartTooltipContent />}
                          formatter={(value: number) => [formatCurrency(value), "Comissão"]}
                        />
                        <Bar dataKey="comissao" fill="var(--color-comissao)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Gráfico de Status das Vendas */}
              <Card>
                <CardHeader>
                  <CardTitle>Status das Vendas</CardTitle>
                  <CardDescription>Distribuição entre aprovadas e pendentes no período selecionado</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      aprovadas: {
                        label: "Aprovadas",
                        color: "hsl(var(--chart-1))",
                      },
                      pendentes: {
                        label: "Pendentes",
                        color: "hsl(var(--chart-2))",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getStatusDistribution()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {getStatusDistribution().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartTooltip
                          content={<ChartTooltipContent />}
                          formatter={(value: number, name: string) => [`${value} vendas`, name]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Gráfico de Pacotes de Marketing */}
              <Card>
                <CardHeader>
                  <CardTitle>Pacotes de Marketing</CardTitle>
                  <CardDescription>Distribuição dos pacotes vendidos no período selecionado</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      count: {
                        label: "Quantidade",
                        color: "hsl(var(--chart-3))",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getPacotesMarketing()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="pacote" />
                        <YAxis domain={[0, "dataMax + 1"]} />
                        <ChartTooltip
                          content={<ChartTooltipContent />}
                          formatter={(value: number, name: string) => {
                            if (name === "count") return [`${value} pacotes`, "Quantidade"]
                            return [formatCurrency(value), "Valor Total"]
                          }}
                        />
                        <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {(currentUser.role === "admin" || currentUser.role === "financeiro") && (
              <Card>
                <CardHeader>
                  <CardTitle>Análise de Tendência</CardTitle>
                  <CardDescription>Projeção e tendência das vendas no período selecionado</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      tendencia: {
                        label: "Tendência",
                        color: "hsl(var(--chart-4))",
                      },
                    }}
                    className="h-[400px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getTendenciaVendas()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis
                          tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                          domain={["dataMin", "dataMax + 100"]}
                        />
                        <ChartTooltip
                          content={<ChartTooltipContent />}
                          formatter={(value: number) => [formatCurrency(value), "Tendência"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="tendencia"
                          stroke="var(--color-tendencia)"
                          fill="var(--color-tendencia)"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Performance Mensal</CardTitle>
                <CardDescription>Comparativo entre vendas e marketing no período selecionado</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    vendas: {
                      label: "Vendas",
                      color: "hsl(var(--chart-1))",
                    },
                    marketing: {
                      label: "Marketing",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[400px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getPerformanceMensal()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis
                        tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                        domain={[0, "dataMax + 100"]}
                      />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        formatter={(value: number, name: string) => [
                          formatCurrency(value),
                          name === "vendas" ? "Vendas" : "Marketing",
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="vendas" fill="var(--color-vendas)" radius={[4, 4, 0, 0]} name="Vendas" />
                      <Bar dataKey="marketing" fill="var(--color-marketing)" radius={[4, 4, 0, 0]} name="Marketing" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {availableTabs.includes("vendas") && (
            <TabsContent value="vendas" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Novo Registro de Venda</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleVendaSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="pedido">Nº Pedido (6 dígitos)</Label>
                        <Input
                          id="pedido"
                          value={vendaForm.pedido}
                          onChange={(e) =>
                            setVendaForm({ ...vendaForm, pedido: e.target.value.replace(/\D/g, "").slice(0, 6) })
                          }
                          placeholder="000123"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="nota">Nota Fiscal (4 dígitos, opcional)</Label>
                        <Input
                          id="nota"
                          value={vendaForm.nota}
                          onChange={(e) =>
                            setVendaForm({ ...vendaForm, nota: e.target.value.replace(/\D/g, "").slice(0, 4) })
                          }
                          placeholder="0001"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cliente">Cliente</Label>
                        <Input
                          id="cliente"
                          value={vendaForm.cliente}
                          onChange={(e) => setVendaForm({ ...vendaForm, cliente: e.target.value })}
                          placeholder="Nome do cliente"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="desc">Descrição</Label>
                        <Input
                          id="desc"
                          value={vendaForm.desc}
                          onChange={(e) => setVendaForm({ ...vendaForm, desc: e.target.value })}
                          placeholder="Descrição do produto"
                        />
                      </div>
                      <div>
                        <Label htmlFor="valor">Valor (R$)</Label>
                        <Input
                          id="valor"
                          type="number"
                          step="0.01"
                          min="0"
                          value={vendaForm.valor}
                          onChange={(e) => setVendaForm({ ...vendaForm, valor: e.target.value })}
                          placeholder="0.00"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="pag">Forma de Pagamento</Label>
                        <Select
                          value={vendaForm.pag}
                          onValueChange={(value) => setVendaForm({ ...vendaForm, pag: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PIX">PIX</SelectItem>
                            <SelectItem value="Fatura unificada">Fatura unificada</SelectItem>
                            <SelectItem value="Cartão">Cartão</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {vendaForm.pag === "Cartão" && (
                        <div>
                          <Label htmlFor="parc">Parcelas (até 12x)</Label>
                          <Input
                            id="parc"
                            type="number"
                            min="1"
                            max="12"
                            value={vendaForm.parc}
                            onChange={(e) => setVendaForm({ ...vendaForm, parc: e.target.value })}
                          />
                        </div>
                      )}
                      {vendaForm.pag === "Fatura unificada" && (
                        <div className="md:col-span-2">
                          <Label>Links dos Boletos (até 3)</Label>
                          <div className="space-y-2 mt-2">
                            {[0, 1, 2].map((index) => (
                              <Input
                                key={index}
                                value={vendaForm.boletos[index] || ""}
                                onChange={(e) => {
                                  const newBoletos = [...vendaForm.boletos]
                                  newBoletos[index] = e.target.value
                                  setVendaForm({ ...vendaForm, boletos: newBoletos })
                                }}
                                placeholder={`Link do boleto ${index + 1}`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">
                        <Plus className="h-4 w-4 mr-2" />
                        Salvar Registro
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setVendaForm({
                            pedido: "",
                            nota: "",
                            cliente: "",
                            desc: "",
                            valor: "",
                            pag: "PIX",
                            parc: "1",
                            boletos: [],
                          })
                        }
                      >
                        Limpar
                      </Button>
                      {vendaForm.valor && (
                        <div className="flex items-center text-sm text-muted-foreground ml-auto">
                          Comissão: {formatCurrency(Number(vendaForm.valor) * (config.commVenda / 100))}
                        </div>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Registros de Vendas</CardTitle>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por cliente ou pedido"
                          value={searchVendas}
                          onChange={(e) => setSearchVendas(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                      {(currentUser.role === "admin" || currentUser.role === "financeiro") && (
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={exportVendasPDF}>
                            <FileText className="h-4 w-4 mr-2" />
                            PDF
                          </Button>
                          <Button variant="outline" onClick={exportVendasExcel}>
                            <Download className="h-4 w-4 mr-2" />
                            Excel
                          </Button>
                        </div>
                      )}
                      <Button variant="outline" onClick={() => exportCSV(vendas, "vendas")}>
                        <Download className="h-4 w-4 mr-2" />
                        CSV
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pedido</TableHead>
                        <TableHead>Nota</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Vendedora</TableHead>
                        <TableHead>Parcelas</TableHead>
                        {currentUser.role !== "vendedora" && <TableHead>Comissão</TableHead>}
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVendasByUser.map((venda) => (
                        <TableRow key={venda.id}>
                          <TableCell className="font-medium">{venda.pedido}</TableCell>
                          <TableCell>{venda.nota || "-"}</TableCell>
                          <TableCell>{venda.cliente}</TableCell>
                          <TableCell>{formatCurrency(venda.valor)}</TableCell>
                          <TableCell>{venda.vend}</TableCell>
                          <TableCell>{venda.parc}</TableCell>
                          {currentUser.role !== "vendedora" && (
                            <TableCell>{formatCurrency(venda.valor * (config.commVenda / 100))}</TableCell>
                          )}
                          <TableCell>
                            <Badge variant={venda.status === "aprovado" ? "default" : "secondary"}>
                              {venda.status.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {(currentUser.role === "admin" || currentUser.role === "financeiro") && (
                                <EditVendaModal venda={venda} onSave={handleEditVenda} />
                              )}
                              {(currentUser.role === "admin" || currentUser.role === "financeiro") &&
                                venda.status === "pendente" && (
                                  <Button size="sm" variant="outline" onClick={() => approveVenda(venda.id)}>
                                    <Check className="h-3 w-3" />
                                  </Button>
                                )}
                              <Button size="sm" variant="outline" onClick={() => deleteVenda(venda.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {availableTabs.includes("marketing") && (
            <TabsContent value="marketing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Novo Pacote de Marketing</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleMarketingSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="m-pedido">Nº Pedido (6 dígitos)</Label>
                        <Input
                          id="m-pedido"
                          value={marketingForm.pedido}
                          onChange={(e) =>
                            setMarketingForm({
                              ...marketingForm,
                              pedido: e.target.value.replace(/\D/g, "").slice(0, 6),
                            })
                          }
                          placeholder="000123"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="m-cliente">Cliente</Label>
                        <Input
                          id="m-cliente"
                          value={marketingForm.cliente}
                          onChange={(e) => setMarketingForm({ ...marketingForm, cliente: e.target.value })}
                          placeholder="Nome do cliente"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="m-mes">Mês de Referência</Label>
                        <DatePicker date={mesReferencia} onDateChange={setMesReferencia} />
                      </div>
                      <div>
                        <Label htmlFor="m-pacote">Pacote</Label>
                        <Select
                          value={marketingForm.pacote}
                          onValueChange={(value) => setMarketingForm({ ...marketingForm, pacote: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bronze">Bronze - R$ {config.pacoteValues.bronze.toFixed(2)}</SelectItem>
                            <SelectItem value="prata">Prata - R$ {config.pacoteValues.prata.toFixed(2)}</SelectItem>
                            <SelectItem value="ouro">Ouro - R$ {config.pacoteValues.ouro.toFixed(2)}</SelectItem>
                            <SelectItem value="diamante">
                              Diamante - R$ {config.pacoteValues.diamante.toFixed(2)}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <MarketingCommissionModal
                          onSave={(cfg) => setMarketingForm({ ...marketingForm, comissaoConfig: cfg })}
                          availableVendedoras={availableVendedorasForMarketing}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">
                        <Plus className="h-4 w-4 mr-2" />
                        Salvar Pacote
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setMarketingForm({
                            pedido: "",
                            cliente: "",
                            mes: "",
                            pacote: "bronze",
                            comissaoConfig: null,
                          })
                        }
                      >
                        Limpar
                      </Button>
                      <div className="flex items-center text-sm text-muted-foreground ml-auto">
                        Comissão prevista:{" "}
                        {marketingForm.comissaoConfig
                          ? formatCurrency(
                              (config.pacoteValues[marketingForm.pacote as keyof typeof config.pacoteValues] *
                                marketingForm.comissaoConfig.percentage) /
                                100,
                            )
                          : formatCurrency(
                              config.pacoteValues[marketingForm.pacote as keyof typeof config.pacoteValues] *
                                (config.markM1 / 100),
                            )}
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Registros de Marketing</CardTitle>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por cliente ou pedido"
                          value={searchMarketing}
                          onChange={(e) => setSearchMarketing(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                      {(currentUser.role === "admin" || currentUser.role === "financeiro") && (
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={exportMarketingPDF}>
                            <FileText className="h-4 w-4 mr-2" />
                            PDF
                          </Button>
                          <Button variant="outline" onClick={exportMarketingExcel}>
                            <Download className="h-4 w-4 mr-2" />
                            Excel
                          </Button>
                        </div>
                      )}
                      <Button variant="outline" onClick={() => exportCSV(marketing, "marketing")}>
                        <Download className="h-4 w-4 mr-2" />
                        CSV
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pedido</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Pacote</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Vendedora</TableHead>
                        <TableHead>Comissão Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMarketingByUser.map((item) => {
                        const comissaoTotal = getComissaoMarketing(item).total
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.pedido}</TableCell>
                            <TableCell>{item.cliente}</TableCell>
                            <TableCell className="capitalize">{item.pacote}</TableCell>
                            <TableCell>{formatCurrency(item.valor)}</TableCell>
                            <TableCell>{item.vend}</TableCell>
                            <TableCell>{formatCurrency(comissaoTotal)}</TableCell>
                            <TableCell>
                              <Badge variant={item.status === "aprovado" ? "default" : "secondary"}>
                                {item.status.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {(currentUser.role === "admin" || currentUser.role === "financeiro") &&
                                  item.status === "pendente" && (
                                    <Button size="sm" onClick={() => approveMarketing(item.id)}>
                                      <Check className="h-3 w-3 mr-1" />
                                      Aprovar
                                    </Button>
                                  )}
                                <Button size="sm" variant="outline" onClick={() => deleteMarketing(item.id)}>
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Excluir
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {availableTabs.includes("pendencias") && (
            <TabsContent value="pendencias" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pendências - Financeiro</CardTitle>
                  <CardDescription>Registros aguardando aprovação do financeiro</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Pedido</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Vendedora</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendentesVendas.map((venda) => (
                        <TableRow key={venda.id}>
                          <TableCell>
                            <Badge variant="outline">Venda</Badge>
                          </TableCell>
                          <TableCell>{venda.pedido}</TableCell>
                          <TableCell>{venda.cliente}</TableCell>
                          <TableCell>{formatCurrency(venda.valor)}</TableCell>
                          <TableCell>{venda.vend}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => approveVenda(venda.id)}>
                                <Check className="h-3 w-3 mr-1" />
                                Aprovar
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteVenda(venda.id)}>
                                <X className="h-3 w-3 mr-1" />
                                Excluir
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {pendentesMarketing.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Badge variant="outline">Marketing</Badge>
                          </TableCell>
                          <TableCell>{item.pedido}</TableCell>
                          <TableCell>{item.cliente}</TableCell>
                          <TableCell>{formatCurrency(item.valor)}</TableCell>
                          <TableCell>{item.vend}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => approveMarketing(item.id)}>
                                <Check className="h-3 w-3 mr-1" />
                                Aprovar
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteMarketing(item.id)}>
                                <X className="h-3 w-3 mr-1" />
                                Excluir
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {availableTabs.includes("relatorios") && (
            <TabsContent value="relatorios" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Central de Relatórios</CardTitle>
                  <CardDescription>Exporte e compartilhe dados do sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Download className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold">Exportação CSV</h3>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => exportCSV([...vendas, ...marketing], "erp_completo")}
                          className="justify-start"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Relatório Completo (CSV)
                        </Button>
                        <Button variant="outline" onClick={() => exportCSV(vendas, "vendas")} className="justify-start">
                          <Download className="h-4 w-4 mr-2" />
                          Apenas Vendas
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => exportCSV(marketing, "marketing")}
                          className="justify-start"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Apenas Marketing
                        </Button>
                      </div>
                    </div>

                    {(currentUser.role === "admin" || currentUser.role === "financeiro") && (
                      <>
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-3">
                            <FileText className="h-5 w-5 text-red-600" />
                            <h3 className="text-lg font-semibold">Relatórios PDF</h3>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button onClick={exportCompletePDF} className="justify-start">
                              <FileText className="h-4 w-4 mr-2" />
                              Relatório Completo
                            </Button>
                            <Button
                              variant="outline"
                              onClick={exportVendasPDF}
                              className="justify-start bg-transparent"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Relatório de Vendas
                            </Button>
                            <Button
                              variant="outline"
                              onClick={exportMarketingPDF}
                              className="justify-start bg-transparent"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Relatório de Marketing
                            </Button>
                            <Button
                              variant="outline"
                              onClick={exportCommissionReportPDF}
                              className="justify-start bg-transparent"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Relatório de Comissões
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Download className="h-5 w-5 text-green-600" />
                            <h3 className="text-lg font-semibold">Planilhas Excel</h3>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button onClick={exportCompleteExcel} className="justify-start">
                              <Download className="h-4 w-4 mr-2" />
                              Relatório Completo
                            </Button>
                            <Button
                              variant="outline"
                              onClick={exportVendasExcel}
                              className="justify-start bg-transparent"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Relatório de Vendas
                            </Button>
                            <Button
                              variant="outline"
                              onClick={exportMarketingExcel}
                              className="justify-start bg-transparent"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Relatório de Marketing
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="mt-8 space-y-4 border-t pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Mail className="h-5 w-5 text-purple-600" />
                      <h3 className="text-lg font-semibold">Relatórios de Comissão por E-mail</h3>
                    </div>

                    <Alert className="border-blue-200 bg-blue-50">
                      <Mail className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        <strong>Funcionalidade de Preview:</strong> Os botões abaixo geram uma prévia do conteúdo que
                        seria enviado por e-mail. O envio real requer integração com serviços como SendGrid ou Amazon
                        SES.
                      </AlertDescription>
                    </Alert>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {currentUser.role === "vendedora" ? (
                        <Button onClick={() => handleGenerateCommissionEmail(currentUser)} className="justify-start">
                          <Mail className="h-4 w-4 mr-2" />
                          Meu Relatório de Comissão
                        </Button>
                      ) : (
                        <>
                          {users
                            .filter((u) => u.role === "vendedora")
                            .map((salesperson) => (
                              <Button
                                key={salesperson.email}
                                variant="outline"
                                onClick={() => handleGenerateCommissionEmail(salesperson)}
                                className="justify-start"
                              >
                                <Mail className="h-4 w-4 mr-2" />
                                Relatório {salesperson.name}
                              </Button>
                            ))}
                          <Button
                            onClick={() =>
                              alert(
                                "Funcionalidade de envio consolidado para RH em desenvolvimento. Requer integração com backend para envio real de e-mails.",
                              )
                            }
                            className="justify-start"
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Relatório Consolidado RH
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {availableTabs.includes("calculadora") && (
            <TabsContent value="calculadora" className="space-y-6">
              <TaxCalculator />
            </TabsContent>
          )}

          {availableTabs.includes("auditoria") && (
            <TabsContent value="auditoria" className="space-y-6">
              <AuditLog currentUser={currentUser} />
            </TabsContent>
          )}

          {availableTabs.includes("config") && (
            <TabsContent value="config" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações do Sistema</CardTitle>
                  <CardDescription>Ajuste os percentuais de comissão e valores de pacotes</CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      localStorage.setItem("erp_cfg", JSON.stringify(config))

                      securityManager.logAction(
                        currentUser.name,
                        "UPDATE",
                        "CONFIG",
                        "system",
                        [
                          { field: "commVenda", oldValue: "anterior", newValue: config.commVenda },
                          { field: "markM1", oldValue: "anterior", newValue: config.markM1 },
                          { field: "markCont", oldValue: "anterior", newValue: config.markCont },
                          { field: "monthlySalesGoal", oldValue: "anterior", newValue: config.monthlySalesGoal },
                          { field: "pacoteValues.bronze", oldValue: "anterior", newValue: config.pacoteValues.bronze },
                          { field: "pacoteValues.prata", oldValue: "anterior", newValue: config.pacoteValues.prata },
                          { field: "pacoteValues.ouro", oldValue: "anterior", newValue: config.pacoteValues.ouro },
                          {
                            field: "pacoteValues.diamante",
                            oldValue: "anterior",
                            newValue: config.pacoteValues.diamante,
                          },
                        ],
                        "Configurações do sistema atualizadas",
                      )

                      alert("Configurações salvas!")
                    }}
                    className="space-y-4"
                  >
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <Label htmlFor="comm-venda">% Comissão em Vendas</Label>
                        <Input
                          id="comm-venda"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={config.commVenda}
                          onChange={(e) => setConfig({ ...config, commVenda: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="mark-m1">% Marketing Mês 1</Label>
                        <Input
                          id="mark-m1"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={config.markM1}
                          onChange={(e) => setConfig({ ...config, markM1: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="mark-cont">% Marketing Continuidade</Label>
                        <Input
                          id="mark-cont"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={config.markCont}
                          onChange={(e) => setConfig({ ...config, markCont: Number(e.target.value) })}
                        />
                      </div>
                      <div className="md:col-span-3">
                        <Label htmlFor="monthly-sales-goal">Meta de Vendas Mensal (R$)</Label>
                        <Input
                          id="monthly-sales-goal"
                          type="number"
                          min="0"
                          step="100"
                          value={config.monthlySalesGoal}
                          onChange={(e) => setConfig({ ...config, monthlySalesGoal: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mt-6">Valores dos Pacotes de Marketing</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="pacote-bronze">Bronze (R$)</Label>
                        <Input
                          id="pacote-bronze"
                          type="number"
                          min="0"
                          step="1"
                          value={config.pacoteValues.bronze}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              pacoteValues: { ...config.pacoteValues, bronze: Number(e.target.value) },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="pacote-prata">Prata (R$)</Label>
                        <Input
                          id="pacote-prata"
                          type="number"
                          min="0"
                          step="1"
                          value={config.pacoteValues.prata}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              pacoteValues: { ...config.pacoteValues, prata: Number(e.target.value) },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="pacote-ouro">Ouro (R$)</Label>
                        <Input
                          id="pacote-ouro"
                          type="number"
                          min="0"
                          step="1"
                          value={config.pacoteValues.ouro}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              pacoteValues: { ...config.pacoteValues, ouro: Number(e.target.value) },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="pacote-diamante">Diamante (R$)</Label>
                        <Input
                          id="pacote-diamante"
                          type="number"
                          min="0"
                          step="1"
                          value={config.pacoteValues.diamante}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              pacoteValues: { ...config.pacoteValues, diamante: Number(e.target.value) },
                            })
                          }
                        />
                      </div>
                    </div>
                    <Button type="submit">
                      <Settings className="h-4 w-4 mr-2" />
                      Salvar Configurações
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cadastro de Usuários</CardTitle>
                  <CardDescription>Adicione novos usuários ao sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUserSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="user-email">E-mail</Label>
                        <Input
                          id="user-email"
                          type="email"
                          value={userForm.email}
                          onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                          placeholder="usuario@exemplo.com"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="user-name">Nome</Label>
                        <Input
                          id="user-name"
                          value={userForm.name}
                          onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                          placeholder="Nome do usuário"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="user-pass">Senha</Label>
                        <Input
                          id="user-pass"
                          type="password"
                          value={userForm.pass}
                          onChange={(e) => setUserForm({ ...userForm, pass: e.target.value })}
                          placeholder="Senha forte (8+ chars, maiúscula, minúscula, número, especial)"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="user-role">Função</Label>
                        <Select
                          value={userForm.role}
                          onValueChange={(value) => setUserForm({ ...userForm, role: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vendedora">Vendedora</SelectItem>
                            <SelectItem value="financeiro">Financeiro</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button type="submit">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Cadastrar Usuário
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Usuários Cadastrados</CardTitle>
                  <CardDescription>Lista de todos os usuários do sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Função</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.email}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                              {user.role.toUpperCase()}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Sistema de Segurança
                  </CardTitle>
                  <CardDescription>Backup automático e controles de segurança</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Backup Automático</p>
                        <p className="text-sm text-muted-foreground">Backup a cada 30 minutos</p>
                      </div>
                      <Badge variant="default">Ativo</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Criptografia de Dados</p>
                        <p className="text-sm text-muted-foreground">Dados sensíveis criptografados</p>
                      </div>
                      <Badge variant="default">Ativo</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Log de Auditoria</p>
                        <p className="text-sm text-muted-foreground">Todas as ações são registradas</p>
                      </div>
                      <Badge variant="default">Ativo</Badge>
                    </div>

                    <div className="pt-4 border-t">
                      <Button
                        onClick={() => {
                          securityManager.createBackup()
                          alert("Backup manual criado com sucesso!")
                        }}
                        variant="outline"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Criar Backup Manual
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>

      <Dialog open={showEmailPreview} onOpenChange={setShowEmailPreview}>
        <DialogContent className="sm:max-w-[650px] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Preview do Relatório de Comissão</DialogTitle>
          </DialogHeader>
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            {emailPreviewContent && <CommissionEmailTemplate {...emailPreviewContent} />}
          </div>
          <div className="flex justify-end p-4 border-t">
            <Button onClick={() => setShowEmailPreview(false)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
