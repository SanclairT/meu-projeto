"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, LogOut, Eye, EyeOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Types
interface Venda {
  id: string
  cliente_nome: string
  cliente_email?: string
  cliente_telefone?: string
  valor_bruto: number
  desconto: number
  valor_liquido: number
  comissao_percentual: number
  comissao_valor: number
  data_venda: string
  status: string
  observacoes?: string
  vendedor?: {
    nome: string
    email: string
  }
}

interface UserProfile {
  id: string
  nome: string
  email: string
  perfil: string
}

export default function ERPSystem() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [vendas, setVendas] = useState<Venda[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [creatingUsers, setCreatingUsers] = useState(false)
  const [vendaForm, setVendaForm] = useState({
    cliente_nome: "",
    cliente_email: "",
    cliente_telefone: "",
    valor_bruto: "",
    desconto: "0",
    comissao_percentual: "10",
    data_venda: new Date().toISOString().split("T")[0],
    observacoes: "",
  })

  const supabase = createClient()

  useEffect(() => {
    getUser()
  }, [])

  const getUser = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        setUser(null)
        setUserProfile(null)
        setLoading(false)
        return
      }

      setUser(user)

      // Get user profile
      const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

      if (profile) {
        setUserProfile(profile)
        loadVendas()
      }
    } catch (error) {
      console.error("Error getting user:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadVendas = async () => {
    try {
      const response = await fetch("/api/vendas")

      if (!response.ok) {
        throw new Error("Failed to load vendas")
      }

      const data = await response.json()
      setVendas(data.vendas || [])
    } catch (error) {
      console.error("Error loading vendas:", error)
    }
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoginError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      console.log("Tentando login com:", { email, password: "***" })

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Erro no login:", error.message, error)
        setLoginError(`Credenciais inválidas. Erro: ${error.message}`)
        return
      }

      if (data.user) {
        console.log("Login bem-sucedido:", data.user.email)
        setUser(data.user)
        getUser()
      }
    } catch (error) {
      console.error("Erro inesperado no login:", error)
      setLoginError("Erro ao fazer login. Tente novamente.")
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserProfile(null)
    setVendas([])
  }

  const handleVendaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!vendaForm.cliente_nome || !vendaForm.valor_bruto) {
      alert("Cliente e valor são obrigatórios.")
      return
    }

    try {
      const response = await fetch("/api/vendas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cliente_nome: vendaForm.cliente_nome,
          cliente_email: vendaForm.cliente_email,
          cliente_telefone: vendaForm.cliente_telefone,
          valor_bruto: Number.parseFloat(vendaForm.valor_bruto),
          desconto: Number.parseFloat(vendaForm.desconto),
          comissao_percentual: Number.parseFloat(vendaForm.comissao_percentual),
          data_venda: vendaForm.data_venda,
          observacoes: vendaForm.observacoes,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create venda")
      }

      // Reset form and reload data
      setVendaForm({
        cliente_nome: "",
        cliente_email: "",
        cliente_telefone: "",
        valor_bruto: "",
        desconto: "0",
        comissao_percentual: "10",
        data_venda: new Date().toISOString().split("T")[0],
        observacoes: "",
      })

      loadVendas()
      alert("Venda cadastrada com sucesso!")
    } catch (error) {
      console.error("Error creating venda:", error)
      alert("Erro ao cadastrar venda. Tente novamente.")
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const createRequiredUsers = async () => {
    setCreatingUsers(true)
    setLoginError("")

    const users = [
      { email: "admin@local", password: "123456", nome: "Admin", perfil: "admin" },
      { email: "financeiro@local", password: "123456", nome: "Financeiro", perfil: "financeiro" },
      { email: "mayra@local", password: "123456", nome: "Mayra", perfil: "vendedor" },
      { email: "liliane@local", password: "123456", nome: "Liliane", perfil: "vendedor" },
    ]

    try {
      for (const userData of users) {
        console.log(`Criando usuário: ${userData.email}`)

        const { data, error } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
          },
        })

        if (error && !error.message.includes("already registered")) {
          console.error(`Erro ao criar ${userData.email}:`, error.message)
        } else {
          console.log(`Usuário ${userData.email} criado/já existe`)
        }
      }

      alert("Usuários criados com sucesso! Agora você pode fazer login com qualquer uma das contas listadas.")
    } catch (error) {
      console.error("Erro ao criar usuários:", error)
      setLoginError("Erro ao criar usuários. Tente novamente.")
    } finally {
      setCreatingUsers(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Sistema ERP</CardTitle>
            <CardDescription>Gestão Completa de Vendas e Marketing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Contas de teste disponíveis:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-600">admin@local</span>
                  <span className="text-gray-600">Admin</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">financeiro@local</span>
                  <span className="text-gray-600">Financeiro</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">mayra@local</span>
                  <span className="text-gray-600">Vendedora</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">liliane@local</span>
                  <span className="text-gray-600">Vendedora</span>
                </div>
                <div className="text-center text-blue-600 font-medium mt-2">Senha padrão: 123456</div>
              </div>
            </div>

            <div className="mb-4">
              <Button
                onClick={createRequiredUsers}
                disabled={creatingUsers}
                className="w-full bg-green-600 hover:bg-green-700 mb-4"
              >
                {creatingUsers ? "Criando usuários..." : "Primeiro acesso? Clique aqui para criar as contas"}
              </Button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" placeholder="seu@exemplo.com" required />
              </div>
              <div>
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {loginError && (
                <Alert variant="destructive">
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                Entrar no Sistema
              </Button>
            </form>

            <div className="text-center mt-6">
              <a href="#" className="text-sm text-blue-600 hover:underline block">
                Esqueceu sua senha?
              </a>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="text-center text-gray-600 font-medium mb-4">Recursos do sistema:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="mr-2">💰</span>
                  Gestão de Vendas
                </div>
                <div className="flex items-center">
                  <span className="mr-2">📈</span>
                  Marketing
                </div>
                <div className="flex items-center">
                  <span className="mr-2">📊</span>
                  Relatórios
                </div>
                <div className="flex items-center">
                  <span className="mr-2">📋</span>
                  Dashboard
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Sistema ERP</h1>
              <p className="text-sm text-gray-500">Bem-vindo, {userProfile.nome}</p>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="vendas" className="space-y-6">
          <TabsList>
            <TabsTrigger value="vendas">Vendas</TabsTrigger>
            <TabsTrigger value="nova-venda">Nova Venda</TabsTrigger>
          </TabsList>

          <TabsContent value="vendas">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Vendas</CardTitle>
                <CardDescription>Gerencie todas as vendas do sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Comissão</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      {userProfile.perfil !== "vendedor" && <TableHead>Vendedor</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendas.map((venda) => (
                      <TableRow key={venda.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{venda.cliente_nome}</div>
                            {venda.cliente_email && <div className="text-sm text-gray-500">{venda.cliente_email}</div>}
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(venda.valor_liquido)}</TableCell>
                        <TableCell>
                          {formatCurrency(venda.comissao_valor)} ({venda.comissao_percentual}%)
                        </TableCell>
                        <TableCell>{new Date(venda.data_venda).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>
                          <Badge variant={venda.status === "confirmada" ? "default" : "secondary"}>
                            {venda.status}
                          </Badge>
                        </TableCell>
                        {userProfile.perfil !== "vendedor" && <TableCell>{venda.vendedor?.nome || "N/A"}</TableCell>}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {vendas.length === 0 && <div className="text-center py-8 text-gray-500">Nenhuma venda encontrada</div>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nova-venda">
            <Card>
              <CardHeader>
                <CardTitle>Nova Venda</CardTitle>
                <CardDescription>Cadastre uma nova venda no sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVendaSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cliente_nome">Nome do Cliente *</Label>
                      <Input
                        id="cliente_nome"
                        value={vendaForm.cliente_nome}
                        onChange={(e) => setVendaForm({ ...vendaForm, cliente_nome: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cliente_email">E-mail do Cliente</Label>
                      <Input
                        id="cliente_email"
                        type="email"
                        value={vendaForm.cliente_email}
                        onChange={(e) => setVendaForm({ ...vendaForm, cliente_email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cliente_telefone">Telefone do Cliente</Label>
                      <Input
                        id="cliente_telefone"
                        value={vendaForm.cliente_telefone}
                        onChange={(e) => setVendaForm({ ...vendaForm, cliente_telefone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="valor_bruto">Valor Bruto *</Label>
                      <Input
                        id="valor_bruto"
                        type="number"
                        step="0.01"
                        value={vendaForm.valor_bruto}
                        onChange={(e) => setVendaForm({ ...vendaForm, valor_bruto: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="desconto">Desconto</Label>
                      <Input
                        id="desconto"
                        type="number"
                        step="0.01"
                        value={vendaForm.desconto}
                        onChange={(e) => setVendaForm({ ...vendaForm, desconto: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="comissao_percentual">Comissão (%)</Label>
                      <Input
                        id="comissao_percentual"
                        type="number"
                        step="0.1"
                        value={vendaForm.comissao_percentual}
                        onChange={(e) => setVendaForm({ ...vendaForm, comissao_percentual: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="data_venda">Data da Venda</Label>
                      <Input
                        id="data_venda"
                        type="date"
                        value={vendaForm.data_venda}
                        onChange={(e) => setVendaForm({ ...vendaForm, data_venda: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="observacoes">Observações</Label>
                    <Input
                      id="observacoes"
                      value={vendaForm.observacoes}
                      onChange={(e) => setVendaForm({ ...vendaForm, observacoes: e.target.value })}
                      placeholder="Observações sobre a venda..."
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Venda
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
