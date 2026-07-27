'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, Eye, Edit, Trash2, Calendar, User, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useData } from '@/hooks/use-data'

const statusColors: Record<string, string> = {
  'Recebido': 'bg-blue-100 text-blue-800',
  'Em análise': 'bg-yellow-100 text-yellow-800',
  'Aguardando orçamento': 'bg-orange-100 text-orange-800',
  'Orçamento enviado': 'bg-purple-100 text-purple-800',
  'Aguardando aprovação': 'bg-pink-100 text-pink-800',
  'Aguardando peças': 'bg-indigo-100 text-indigo-800',
  'Em reparo': 'bg-cyan-100 text-cyan-800',
  'Em testes': 'bg-teal-100 text-teal-800',
  'Finalizado': 'bg-green-100 text-green-800',
  'Pronto para retirada': 'bg-emerald-100 text-emerald-800',
  'Entregue': 'bg-gray-100 text-gray-800',
  'Cancelado': 'bg-red-100 text-red-800',
  'Garantia': 'bg-lime-100 text-lime-800'
}

const priorityColors: Record<string, string> = {
  'Normal': 'bg-gray-100 text-gray-800',
  'Urgente': 'bg-orange-100 text-orange-800',
  'Emergencial': 'bg-red-100 text-red-800'
}

export default function ServiceOrdersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { fetchServiceOrders, fetchClients, deleteServiceOrder } = useData()
  
  const [orders, setOrders] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [ordersData, clientsData] = await Promise.all([
        fetchServiceOrders(),
        fetchClients()
      ])
      setOrders(ordersData)
      setClients(clientsData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar as ordens de serviço.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    return client?.nome || 'Cliente não encontrado'
  }

  const filteredOrders = orders.filter(order => {
    const clientName = getClientName(order.client_id).toLowerCase()
    const search = searchTerm.toLowerCase()
    return (
      order.number.toLowerCase().includes(search) ||
      clientName.includes(search) ||
      order.status.toLowerCase().includes(search)
    )
  })

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta ordem de serviço?')) return
    
    try {
      await deleteServiceOrder(id)
      setOrders(orders.filter(o => o.id !== id))
      toast({ title: 'Ordem de serviço excluída com sucesso' })
    } catch (error) {
      console.error('Error deleting order:', error)
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a ordem de serviço.',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ordens de Serviço</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie todas as ordens de serviço</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => router.push('/')}>
              Voltar
            </Button>
            <Button onClick={() => router.push('/os/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Nova OS
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por número, cliente ou status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <div className="text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'Nenhuma ordem de serviço encontrada para a busca' : 'Nenhuma ordem de serviço cadastrada'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map(order => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{order.number}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                          {order.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[order.priority] || 'bg-gray-100 text-gray-800'}`}>
                          {order.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {getClientName(order.client_id)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(order.entry_date).toLocaleDateString('pt-BR')}
                        </div>
                        {order.expected_delivery_date && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Previsão: {new Date(order.expected_delivery_date).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                      {order.technician && (
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          Técnico: {order.technician}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/os/${order.id}`)}>
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => router.push(`/os/${order.id}`)}>
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(order.id)}>
                        <Trash2 className="w-4 h-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
