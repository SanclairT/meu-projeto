import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

interface Venda {
  pedido: string
  cliente: string
  valor: number
  vend: string
  status: string
  created: string
  nota?: string
}

interface Marketing {
  pedido: string
  cliente: string
  pacote: string
  valor: number
  vend: string
  status: string
  created: string
}

export const generateVendasPDF = (vendas: Venda[]) => {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(20)
  doc.text("Relatório de Vendas", 20, 20)

  doc.setFontSize(12)
  doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 20, 30)
  doc.text(`Total de registros: ${vendas.length}`, 20, 40)

  // Totais
  const totalVendas = vendas.reduce((sum, v) => sum + v.valor, 0)
  const totalAprovadas = vendas.filter((v) => v.status === "aprovado").length
  const totalPendentes = vendas.filter((v) => v.status === "pendente").length

  doc.text(`Total em vendas: ${totalVendas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`, 20, 50)
  doc.text(`Aprovadas: ${totalAprovadas} | Pendentes: ${totalPendentes}`, 20, 60)

  // Tabela
  const tableData = vendas.map((venda) => [
    venda.pedido,
    venda.cliente,
    venda.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
    venda.vend,
    venda.status.toUpperCase(),
    new Date(venda.created).toLocaleDateString("pt-BR"),
  ])

  autoTable(doc, {
    head: [["Pedido", "Cliente", "Valor", "Vendedora", "Status", "Data"]],
    body: tableData,
    startY: 70,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
  })

  return doc
}

export const generateMarketingPDF = (marketing: Marketing[]) => {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(20)
  doc.text("Relatório de Marketing", 20, 20)

  doc.setFontSize(12)
  doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 20, 30)
  doc.text(`Total de registros: ${marketing.length}`, 20, 40)

  // Totais
  const totalMarketing = marketing.reduce((sum, m) => sum + m.valor, 0)
  const totalAprovadas = marketing.filter((m) => m.status === "aprovado").length
  const totalPendentes = marketing.filter((m) => m.status === "pendente").length

  doc.text(
    `Total em marketing: ${totalMarketing.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
    20,
    50,
  )
  doc.text(`Aprovadas: ${totalAprovadas} | Pendentes: ${totalPendentes}`, 20, 60)

  // Tabela
  const tableData = marketing.map((item) => [
    item.pedido,
    item.cliente,
    item.pacote.toUpperCase(),
    item.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
    item.vend,
    item.status.toUpperCase(),
    new Date(item.created).toLocaleDateString("pt-BR"),
  ])

  autoTable(doc, {
    head: [["Pedido", "Cliente", "Pacote", "Valor", "Vendedora", "Status", "Data"]],
    body: tableData,
    startY: 70,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [34, 197, 94] },
  })

  return doc
}

export const generateCompletePDF = (vendas: Venda[], marketing: Marketing[]) => {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(20)
  doc.text("Relatório Completo - ERP Sistema", 20, 20)

  doc.setFontSize(12)
  doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 20, 30)

  // Resumo executivo
  const totalVendas = vendas.reduce((sum, v) => sum + v.valor, 0)
  const totalMarketing = marketing.reduce((sum, m) => sum + m.valor, 0)
  const totalGeral = totalVendas + totalMarketing

  doc.setFontSize(14)
  doc.text("Resumo Executivo", 20, 50)

  doc.setFontSize(12)
  doc.text(`Total Vendas: ${totalVendas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`, 20, 65)
  doc.text(`Total Marketing: ${totalMarketing.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`, 20, 75)
  doc.text(`Total Geral: ${totalGeral.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`, 20, 85)

  // Vendas
  doc.setFontSize(14)
  doc.text("Vendas", 20, 105)

  const vendasTableData = vendas
    .slice(0, 10)
    .map((venda) => [
      venda.pedido,
      venda.cliente,
      venda.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      venda.vend,
      venda.status.toUpperCase(),
    ])

  autoTable(doc, {
    head: [["Pedido", "Cliente", "Valor", "Vendedora", "Status"]],
    body: vendasTableData,
    startY: 115,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
  })

  // Nova página para marketing se necessário
  if (marketing.length > 0) {
    doc.addPage()

    doc.setFontSize(14)
    doc.text("Marketing", 20, 20)

    const marketingTableData = marketing
      .slice(0, 10)
      .map((item) => [
        item.pedido,
        item.cliente,
        item.pacote.toUpperCase(),
        item.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
        item.vend,
        item.status.toUpperCase(),
      ])

    autoTable(doc, {
      head: [["Pedido", "Cliente", "Pacote", "Valor", "Vendedora", "Status"]],
      body: marketingTableData,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [34, 197, 94] },
    })
  }

  return doc
}

export const generateCommissionPDF = (commissionData: any[], config: any) => {
  const doc = new jsPDF()

  doc.setFontSize(20)
  doc.text("Relatório de Comissões", 20, 20)

  doc.setFontSize(12)
  doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 20, 30)

  const tableData = Object.entries(commissionData).map(([vendedora, data]: [string, any]) => [
    vendedora,
    data.vendas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
    data.marketing.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
    data.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
  ])

  autoTable(doc, {
    head: [["Vendedora", "Comissão Vendas", "Comissão Marketing", "Total"]],
    body: tableData,
    startY: 50,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [34, 197, 94] },
  })

  return doc
}
