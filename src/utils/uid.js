// src/utils/uid.js
// Função centralizada para obter o user_id autenticado
// Usada por fin.js, leads.js e mapa.js
import { useAuthStore } from '@/stores/auth'

export function uid() {
  const auth = useAuthStore()
  if (!auth.user?.id) {
    console.error('[SLAC] uid() chamado sem usuário autenticado')
    throw new Error('Usuário não autenticado')
  }
  return auth.user.id
}
