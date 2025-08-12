import * as XLSX from "xlsx"

interface ExportData {
  [key: string]: any
}

export class ExcelExporter {
  static exportToExcel(data: ExportData[], filename: string, sheetName = "Dados"): void {
    try {
      // Criar workbook
      const wb = XLSX.utils.book_new()

      // Converter dados para worksheet
      const ws = XLSX.utils.json_to_sheet(data)

      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(wb, ws, sheetName)

      // Salvar arquivo
      XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`)
    } catch (error) {
      console.error("Erro ao exportar Excel:", error)
      alert("Erro ao exportar arquivo Excel")
    }
  }

  static exportMultipleSheets(sheets: Array<{ data: ExportData[]; name: string }>, filename: string): void {
    try {
      const wb = XLSX.utils.book_new()

      sheets.forEach(({ data, name }) => {
        const ws = XLSX.utils.json_to_sheet(data)
        XLSX.utils.book_append_sheet(wb, ws, name)
      })

      XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`)
    } catch (error) {
      console.error("Erro ao exportar Excel com múltiplas abas:", error)
      alert("Erro ao exportar arquivo Excel")
    }
  }

  static exportCommissionReport(vendas: any[], marketing: any[], config: any): void {
    try {
      // Calcular comissões
      const commissionData: { [key: string]: any } = {}

      // Comissões de vendas
      vendas
        .filter((v) => v.status === "aprovado")
        .forEach((venda) => {
          if (!commissionData[venda.vend]) {
            commissionData[venda.vend] = {
              Vendedora: venda.vend,
              "Comissão Vendas": 0,
              "Comissão Marketing": 0,
              "Total Comissões": 0,
              "Vendas Realizadas": 0,
              "Marketing Realizado": 0,
            }
          }
          const comissao = venda.valor * (config.commVenda / 100)
          commissionData[venda.vend]["Comissão Vendas"] += comissao
          commissionData[venda.vend]["Total Comissões"] += comissao
          commissionData[venda.vend]["Vendas Realizadas"] += venda.valor
        })

      // Comissões de marketing
      marketing
        .filter((m) => m.status === "aprovado")
        .forEach((item) => {
          if (item.comissaoConfig) {
            const comissaoTotal = item.valor * (item.comissaoConfig.percentage / 100)
            const comissaoPorVendedora = comissaoTotal / item.comissaoConfig.vendedoras.length

            item.comissaoConfig.vendedoras.forEach((vendedora: string) => {
              if (!commissionData[vendedora]) {
                commissionData[vendedora] = {
                  Vendedora: vendedora,
                  "Comissão Vendas": 0,
                  "Comissão Marketing": 0,
                  "Total Comissões": 0,
                  "Vendas Realizadas": 0,
                  "Marketing Realizado": 0,
                }
              }
              commissionData[vendedora]["Comissão Marketing"] += comissaoPorVendedora
              commissionData[vendedora]["Total Comissões"] += comissaoPorVendedora
              commissionData[vendedora]["Marketing Realizado"] += item.valor / item.comissaoConfig.vendedoras.length
            })
          } else {
            if (!commissionData[item.vend]) {
              commissionData[item.vend] = {
                Vendedora: item.vend,
                "Comissão Vendas": 0,
                "Comissão Marketing": 0,
                "Total Comissões": 0,
                "Vendas Realizadas": 0,
                "Marketing Realizado": 0,
              }
            }
            const comissao = item.valor * (config.markM1 / 100)
            commissionData[item.vend]["Comissão Marketing"] += comissao
            commissionData[item.vend]["Total Comissões"] += comissao
            commissionData[item.vend]["Marketing Realizado"] += item.valor
          }
        })

      // Preparar dados para exportação
      const sheets = [
        {
          data: Object.values(commissionData),
          name: "Comissões",
        },
        {
          data: vendas.map((v) => ({
            Pedido: v.pedido,
            Cliente: v.cliente,
            Valor: v.valor,
            Vendedora: v.vend,
            Status: v.status,
            Data: new Date(v.created).toLocaleDateString("pt-BR"),
            Comissão: v.valor * (config.commVenda / 100),
          })),
          name: "Vendas",
        },
        {
          data: marketing.map((m) => ({
            Pedido: m.pedido,
            Cliente: m.cliente,
            Pacote: m.pacote,
            Valor: m.valor,
            Vendedora: m.vend,
            Status: m.status,
            Data: new Date(m.created).toLocaleDateString("pt-BR"),
          })),
          name: "Marketing",
        },
      ]

      this.exportMultipleSheets(sheets, "relatorio_comissoes")
    } catch (error) {
      console.error("Erro ao exportar relatório de comissões:", error)
      alert("Erro ao exportar relatório de comissões")
    }
  }
}
