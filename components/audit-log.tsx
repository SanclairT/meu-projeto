"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Download } from "lucide-react"

interface AuditEntry {
  id: string
  timestamp: string
  user: string
  action: string
  entity: string
  entityId: string
  changes: {
    field: string
    oldValue: any
    newValue: any
  }[]
  description: string
}

interface AuditLogProps {
  currentUser: { name: string; role: string }
}

export function AuditLog({ currentUser }: AuditLogProps) {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const savedAudit = localStorage.getItem("erp_audit_log")
    if (savedAudit) {
      setAuditEntries(JSON.parse(savedAudit))
    }
  }, [])

  const filteredEntries = auditEntries.filter(
    (entry) =>
      entry.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const exportAuditLog = () => {
    const csv = [
      "Data,Usuário,Ação,Entidade,ID,Descrição,Alterações",
      ...auditEntries.map((entry) =>
        [
          new Date(entry.timestamp).toLocaleString("pt-BR"),
          entry.user,
          entry.action,
          entry.entity,
          entry.entityId,
          entry.description,
          entry.changes.map((c) => `${c.field}: ${c.oldValue} → ${c.newValue}`).join("; "),
        ]
          .map((field) => `"${String(field).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `audit_log_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (currentUser.role === "vendedora") {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">Acesso restrito para administradores e financeiro.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Histórico de Auditoria</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar no histórico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline" onClick={exportAuditLog}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Alterações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-mono text-sm">{new Date(entry.timestamp).toLocaleString("pt-BR")}</TableCell>
                <TableCell>
                  <Badge variant="outline">{entry.user}</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      entry.action === "CREATE" ? "default" : entry.action === "UPDATE" ? "secondary" : "destructive"
                    }
                  >
                    {entry.action}
                  </Badge>
                </TableCell>
                <TableCell>{entry.entity}</TableCell>
                <TableCell>{entry.description}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {entry.changes.map((change, index) => (
                      <div key={index} className="text-xs">
                        <span className="font-medium">{change.field}:</span>{" "}
                        <span className="text-red-600">{String(change.oldValue)}</span> →{" "}
                        <span className="text-green-600">{String(change.newValue)}</span>
                      </div>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredEntries.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? "Nenhum registro encontrado para a busca." : "Nenhum registro de auditoria encontrado."}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
