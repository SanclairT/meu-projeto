"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Edit } from "lucide-react"

interface Venda {
  id: string
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

interface EditVendaModalProps {
  venda: Venda
  onSave: (updatedVenda: Venda) => void
}

export function EditVendaModal({ venda, onSave }: EditVendaModalProps) {
  const [open, setOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    nota: venda.nota || "",
    boletos: venda.boletos || ["", "", ""],
  })

  const handleSave = () => {
    const updatedVenda = {
      ...venda,
      nota: editForm.nota || undefined,
      boletos: editForm.boletos.filter((b) => b.trim() !== ""),
    }
    onSave(updatedVenda)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Edit className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Venda - Pedido {venda.pedido}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-nota">Nota Fiscal (4 dígitos)</Label>
            <Input
              id="edit-nota"
              value={editForm.nota}
              onChange={(e) => setEditForm({ ...editForm, nota: e.target.value.replace(/\D/g, "").slice(0, 4) })}
              placeholder="0001"
            />
          </div>

          {venda.pag === "Fatura unificada" && (
            <div className="space-y-2">
              <Label>Links dos Boletos (até 3)</Label>
              {editForm.boletos.map((boleto, index) => (
                <Input
                  key={index}
                  value={boleto}
                  onChange={(e) => {
                    const newBoletos = [...editForm.boletos]
                    newBoletos[index] = e.target.value
                    setEditForm({ ...editForm, boletos: newBoletos })
                  }}
                  placeholder={`Link do boleto ${index + 1}`}
                />
              ))}
            </div>
          )}

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
