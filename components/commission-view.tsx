"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Venda {
  id: string
  pedido: string
  cliente: string
  valor: number
  vend: string
  status: "pendente" | "aprovado"
  created: string
}

interface Marketing {
  id: string
  pedido: string
  cliente: string
  valor: number
  vend: string
  status: "pendente" | "aprovado"
  created: string
  comissaoConfig?: {
    percentage: number
    vendedoras: string[]
  }
}

interface CommissionViewProps {
  vendas: Venda[]
  marketing: Marketing[]
  config: { commVenda: number; markM1: number }
  currentUser: { name: string; role: string }
}

export function CommissionView({ vendas, marketing, config, currentUser }: CommissionViewProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  // Calcular comissões por vendedora
  const getCommissionData = () => {
    const commissionData: { [key: string]: { vendas: number; marketing: number; total: number } } = {}

    // Comissões de vendas
    vendas
      .filter((v) => v.status === "aprovado")
      .forEach((venda) => {
        if (!commissionData[venda.vend]) {
          commissionData[venda.vend] = { vendas: 0, marketing: 0, total: 0 }
        }
        const comissao = venda.valor * (config.commVenda / 100)
        commissionData[venda.vend].vendas += comissao
        commissionData[venda.vend].total += comissao
      })

    // Comissões de marketing
    marketing
      .filter((m) => m.status === "aprovado")
      .forEach((item) => {
        if (item.comissaoConfig) {
          const comissaoTotal = item.valor * (item.comissaoConfig.percentage / 100)
          const comissaoPorVendedora = comissaoTotal / item.comissaoConfig.vendedoras.length

          item.comissaoConfig.vendedoras.forEach((vendedora) => {
            if (!commissionData[vendedora]) {
              commissionData[vendedora] = { vendas: 0, marketing: 0, total: 0 }
            }
            commissionData[vendedora].marketing += comissaoPorVendedora
            commissionData[vendedora].total += comissaoPorVendedora
          })
        } else {
          if (!commissionData[item.vend]) {
            commissionData[item.vend] = { vendas: 0, marketing: 0, total: 0 }
          }
          const comissao = item.valor * (config.markM1 / 100)
          commissionData[item.vend].marketing += comissao
          commissionData[item.vend].total += comissao
        }
      })

    return commissionData
  }

  const commissionData = getCommissionData()

  // Se for vendedora, mostrar apenas suas próprias comissões
  const filteredData =
    currentUser.role === "vendedora"
      ? { [currentUser.name]: commissionData[currentUser.name] || { vendas: 0, marketing: 0, total: 0 } }
      : commissionData

  return (
    <Card>
      <CardHeader>
        <CardTitle>{currentUser.role === "vendedora" ? "Suas Comissões" : "Comissões por Vendedora"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendedora</TableHead>
              <TableHead>Comissão Vendas</TableHead>
              <TableHead>Comissão Marketing</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(filteredData).map(([vendedora, data]) => (
              <TableRow key={vendedora}>
                <TableCell className="font-medium">
                  {vendedora}
                  {vendedora === currentUser.name && (
                    <Badge variant="outline" className="ml-2">
                      Você
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{formatCurrency(data.vendas)}</TableCell>
                <TableCell>{formatCurrency(data.marketing)}</TableCell>
                <TableCell className="font-bold">{formatCurrency(data.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
