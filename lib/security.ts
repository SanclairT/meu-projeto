// Sistema de backup e segurança
export class SecurityManager {
  private static instance: SecurityManager
  private backupInterval: NodeJS.Timeout | null = null

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager()
    }
    return SecurityManager.instance
  }

  // Criptografia simples para dados sensíveis
  encrypt(data: string): string {
    try {
      return btoa(encodeURIComponent(data))
    } catch (error) {
      console.error("Erro na criptografia:", error)
      return data
    }
  }

  decrypt(encryptedData: string): string {
    try {
      return decodeURIComponent(atob(encryptedData))
    } catch (error) {
      console.error("Erro na descriptografia:", error)
      return encryptedData
    }
  }

  // Backup automático
  startAutoBackup(): void {
    this.backupInterval = setInterval(
      () => {
        this.createBackup()
      },
      30 * 60 * 1000,
    ) // Backup a cada 30 minutos
  }

  stopAutoBackup(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval)
      this.backupInterval = null
    }
  }

  createBackup(): void {
    try {
      const timestamp = new Date().toISOString()
      const backupData = {
        timestamp,
        vendas: localStorage.getItem("erp_vendas"),
        marketing: localStorage.getItem("erp_mark"),
        users: localStorage.getItem("erp_users"),
        config: localStorage.getItem("erp_cfg"),
        notifications: localStorage.getItem("erp_notifications"),
        auditLog: localStorage.getItem("erp_audit_log"),
      }

      const backupKey = `erp_backup_${timestamp.slice(0, 10)}`
      localStorage.setItem(backupKey, JSON.stringify(backupData))

      // Manter apenas os últimos 7 backups
      this.cleanOldBackups()
    } catch (error) {
      console.error("Erro ao criar backup:", error)
    }
  }

  private cleanOldBackups(): void {
    const keys = Object.keys(localStorage).filter((key) => key.startsWith("erp_backup_"))
    if (keys.length > 7) {
      keys
        .sort()
        .slice(0, keys.length - 7)
        .forEach((key) => localStorage.removeItem(key))
    }
  }

  restoreBackup(backupKey: string): boolean {
    try {
      const backupData = localStorage.getItem(backupKey)
      if (!backupData) return false

      const data = JSON.parse(backupData)
      Object.entries(data).forEach(([key, value]) => {
        if (key !== "timestamp" && value) {
          localStorage.setItem(key, value as string)
        }
      })

      return true
    } catch (error) {
      console.error("Erro ao restaurar backup:", error)
      return false
    }
  }

  getAvailableBackups(): Array<{ key: string; date: string }> {
    return Object.keys(localStorage)
      .filter((key) => key.startsWith("erp_backup_"))
      .map((key) => ({
        key,
        date: key.replace("erp_backup_", ""),
      }))
      .sort((a, b) => b.date.localeCompare(a.date))
  }

  // Validação de senha forte
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push("Senha deve ter pelo menos 8 caracteres")
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Senha deve conter pelo menos uma letra maiúscula")
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Senha deve conter pelo menos uma letra minúscula")
    }
    if (!/\d/.test(password)) {
      errors.push("Senha deve conter pelo menos um número")
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Senha deve conter pelo menos um caractere especial")
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  // Log de auditoria
  logAction(user: string, action: string, entity: string, entityId: string, changes: any[], description: string): void {
    try {
      const auditEntry = {
        id: Math.random().toString(36).slice(2, 10),
        timestamp: new Date().toISOString(),
        user,
        action,
        entity,
        entityId,
        changes,
        description,
      }

      const existingLog = JSON.parse(localStorage.getItem("erp_audit_log") || "[]")
      const updatedLog = [auditEntry, ...existingLog].slice(0, 1000) // Manter apenas 1000 registros
      localStorage.setItem("erp_audit_log", JSON.stringify(updatedLog))
    } catch (error) {
      console.error("Erro ao registrar ação de auditoria:", error)
    }
  }
}

export const securityManager = SecurityManager.getInstance()
