"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Calculator, ArrowRightLeft } from "lucide-react"

export function TaxCalculator() {
  const [netValue, setNetValue] = useState("")
  const [taxRate, setTaxRate] = useState("")
  const [grossValue, setGrossValue] = useState("")
  const [calculationMode, setCalculationMode] = useState<"netToGross" | "grossToNet">("netToGross")

  const calculateGrossValue = () => {
    const net = Number.parseFloat(netValue)
    const rate = Number.parseFloat(taxRate)

    if (isNaN(net) || isNaN(rate)) {
      alert("Por favor, insira valores válidos")
      return
    }

    if (calculationMode === "netToGross") {
      // Valor Bruto = Valor Líquido / (1 - (Alíquota / 100))
      const gross = net / (1 - rate / 100)
      setGrossValue(gross.toFixed(2))
    } else {
      // Valor Líquido = Valor Bruto * (1 - (Alíquota / 100))
      const gross = Number.parseFloat(grossValue)
      if (isNaN(gross)) {
        alert("Por favor, insira o valor bruto")
        return
      }
      const net = gross * (1 - rate / 100)
      setNetValue(net.toFixed(2))
    }
  }

  const clearCalculation = () => {
    setNetValue("")
    setTaxRate("")
    setGrossValue("")
  }

  const formatCurrency = (value: string) => {
    const num = Number.parseFloat(value)
    if (isNaN(num)) return "R$ 0,00"
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(num)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Calculadora de Alíquota
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant={calculationMode === "netToGross" ? "default" : "outline"}
            size="sm"
            onClick={() => setCalculationMode("netToGross")}
          >
            Líquido → Bruto
          </Button>
          <ArrowRightLeft className="h-4 w-4" />
          <Button
            variant={calculationMode === "grossToNet" ? "default" : "outline"}
            size="sm"
            onClick={() => setCalculationMode("grossToNet")}
          >
            Bruto → Líquido
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="netValue">Valor Líquido (R$) {calculationMode === "netToGross" ? "*" : ""}</Label>
            <Input
              id="netValue"
              type="number"
              step="0.01"
              value={netValue}
              onChange={(e) => setNetValue(e.target.value)}
              placeholder="500.00"
              disabled={calculationMode === "grossToNet"}
            />
          </div>

          <div>
            <Label htmlFor="taxRate">Alíquota (%) *</Label>
            <Input
              id="taxRate"
              type="number"
              step="0.01"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              placeholder="3.91"
            />
          </div>

          <div>
            <Label htmlFor="grossValue">Valor Bruto (R$) {calculationMode === "grossToNet" ? "*" : ""}</Label>
            <Input
              id="grossValue"
              type="number"
              step="0.01"
              value={grossValue}
              onChange={(e) => setGrossValue(e.target.value)}
              placeholder="520.41"
              disabled={calculationMode === "netToGross"}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={calculateGrossValue} className="flex-1">
            <Calculator className="h-4 w-4 mr-2" />
            Calcular
          </Button>
          <Button variant="outline" onClick={clearCalculation}>
            Limpar
          </Button>
        </div>

        {netValue && grossValue && taxRate && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Resultado:</h3>
            <div className="space-y-1 text-sm">
              <div>
                Valor Líquido: <span className="font-bold">{formatCurrency(netValue)}</span>
              </div>
              <div>
                Valor Bruto: <span className="font-bold">{formatCurrency(grossValue)}</span>
              </div>
              <div>
                Alíquota: <span className="font-bold">{taxRate}%</span>
              </div>
              <div>
                Valor do Imposto:{" "}
                <span className="font-bold text-red-600">
                  {formatCurrency((Number.parseFloat(grossValue) - Number.parseFloat(netValue)).toString())}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>
            <strong>Fórmula:</strong> Valor Bruto = Valor Líquido ÷ (1 - Alíquota ÷ 100)
          </p>
          <p>
            <strong>Exemplo:</strong> R$ 500,00 ÷ (1 - 3,91 ÷ 100) = R$ 520,41
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
