"use client"

interface CommissionReportItem {
  type: "venda" | "marketing"
  pedido: string
  cliente: string
  valor: number
  comissao: number
  status: string
  data: string
  nota?: string
  pacote?: string
  parcelas?: number
  boletos?: string[]
}

interface CommissionEmailTemplateProps {
  salespersonName: string
  reportData: CommissionReportItem[]
  totalCommission: number
  totalSalesValue: number
  commissionPercentage: number
}

export function CommissionEmailTemplate({
  salespersonName,
  reportData,
  totalCommission,
  totalSalesValue,
  commissionPercentage,
}: CommissionEmailTemplateProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        lineHeight: "1.6",
        color: "#333",
        maxWidth: "600px",
        margin: "20px auto",
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        backgroundColor: "#f9f9f9",
      }}
    >
      <h2 style={{ color: "#0056b3", textAlign: "center", marginBottom: "20px" }}>Relatório de Comissão Mensal</h2>
      <p>
        Olá, <strong>{salespersonName}</strong>,
      </p>
      <p>
        Segue seu relatório de comissões referente ao período de{" "}
        {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}.
      </p>

      <div
        style={{
          backgroundColor: "#e9f7ff",
          padding: "15px",
          borderRadius: "5px",
          marginBottom: "20px",
          borderLeft: "5px solid #0056b3",
        }}
      >
        <p style={{ margin: "0 0 5px 0", fontSize: "1.1em" }}>
          <strong>Total de Vendas Aprovadas:</strong> {formatCurrency(totalSalesValue)}
        </p>
        <p style={{ margin: "0 0 5px 0", fontSize: "1.1em" }}>
          <strong>Percentual de Comissão Aplicado:</strong> {commissionPercentage}%
        </p>
        <p style={{ margin: "0", fontSize: "1.2em", fontWeight: "bold", color: "#0056b3" }}>
          <strong>Sua Comissão Total:</strong> {formatCurrency(totalCommission)}
        </p>
      </div>

      <h3 style={{ color: "#0056b3", marginBottom: "15px" }}>Detalhes das Transações Aprovadas:</h3>
      {reportData.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666" }}>Nenhuma transação aprovada neste período.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f2f2f2" }}>
              <th style={{ padding: "8px", border: "1px solid #ddd", textAlign: "left" }}>Tipo</th>
              <th style={{ padding: "8px", border: "1px solid #ddd", textAlign: "left" }}>Pedido</th>
              <th style={{ padding: "8px", border: "1px solid #ddd", textAlign: "left" }}>Cliente</th>
              <th style={{ padding: "8px", border: "1px solid #ddd", textAlign: "right" }}>Valor</th>
              <th style={{ padding: "8px", border: "1px solid #ddd", textAlign: "right" }}>Comissão</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((item, index) => (
              <tr key={index} style={{ backgroundColor: index % 2 === 0 ? "#fff" : "#f9f9f9" }}>
                <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                  {item.type === "venda" ? "Venda" : "Marketing"}
                </td>
                <td style={{ padding: "8px", border: "1px solid #ddd" }}>{item.pedido}</td>
                <td style={{ padding: "8px", border: "1px solid #ddd" }}>{item.cliente}</td>
                <td style={{ padding: "8px", border: "1px solid #ddd", textAlign: "right" }}>
                  {formatCurrency(item.valor)}
                </td>
                <td style={{ padding: "8px", border: "1px solid #ddd", textAlign: "right" }}>
                  {formatCurrency(item.comissao)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p>Atenciosamente,</p>
      <p>
        <strong>Equipe ERP Sistema</strong>
      </p>
      <hr style={{ borderTop: "1px solid #eee", margin: "20px 0" }} />
      <p style={{ fontSize: "0.8em", color: "#666", textAlign: "center" }}>
        Este é um e-mail gerado automaticamente. Por favor, não responda.
      </p>
    </div>
  )
}
