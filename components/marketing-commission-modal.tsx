"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Settings } from "lucide-react"

interface MarketingCommissionModalProps {
  onSave: (config: { percentage: number; vendedoras: string[] }) => void
  availableVendedoras: string[] // Agora recebe a lista de vendedoras como prop
}

export function MarketingCommissionModal({ onSave, availableVendedoras }: MarketingCommissionModalProps) {
  const [open, setOpen] = useState(false)
  const [percentage, setPercentage] = useState("10")
  const [selectedVendedoras, setSelectedVendedoras] = useState<string[]>([])

  const handleSave = () => {
    if (selectedVendedoras.length === 0) {
      alert("Selecione pelo menos uma vendedora")
      return
    }

    onSave({
      percentage: Number(percentage),
      vendedoras: selectedVendedoras,
    })
    setOpen(false)
    setSelectedVendedoras([])
  }

  const handleVendedoraChange = (vendedora: string, checked: boolean) => {
    if (checked) {
      setSelectedVendedoras([...selectedVendedoras, vendedora])
    } else {
      setSelectedVendedoras(selectedVendedoras.filter((v) => v !== vendedora))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configurar Comissão
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configurar Comissão de Marketing</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Percentual de Comissão</Label>
            <RadioGroup value={percentage} onValueChange={setPercentage}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="10" id="r1" />
                <Label htmlFor="r1">10% (Primeira venda)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="5" id="r2" />
                <Label htmlFor="r2">5% (Segunda venda)</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label>Vendedoras Envolvidas</Label>
            <div className="space-y-2 mt-2">
              {availableVendedoras.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma vendedora disponível.</p>
              ) : (
                availableVendedoras.map((vendedora) => (
                  <div key={vendedora} className="flex items-center space-x-2">
                    <Checkbox
                      id={vendedora}
                      checked={selectedVendedoras.includes(vendedora)}
                      onCheckedChange={(checked) => handleVendedoraChange(vendedora, checked as boolean)}
                    />
                    <Label htmlFor={vendedora}>{vendedora}</Label>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
