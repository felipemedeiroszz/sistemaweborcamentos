'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Calendar, User, Clock, CheckCircle, XCircle, MessageCircle } from 'lucide-react'
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

export default function ServiceOrderPortalPage() {
  const params = useParams()
  const { toast } = useToast()
  const { 
    getServiceOrderByToken, fetchClients, fetchServiceEquipment, 
    fetchServiceMedia, fetchServiceTimeline 
  } = useData()

  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<any>(null)
  const [client, setClient] = useState<any>(null)
  const [equipment, setEquipment] = useState<any[]>([])
  const [media, setMedia] = useState<any[]>([])
  const [timeline, setTimeline] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [params.token])

  const loadData = async () => {
    try {
      const orderData = await getServiceOrderByToken(params.token as string)
      setOrder(orderData)

      const [clientsData, equipmentData, mediaData, timelineData] = await Promise.all([
        fetchClients(),
        fetchServiceEquipment(orderData.id),
        fetchServiceMedia(orderData.id),
        fetchServiceTimeline(orderData.id)
      ])

      setClient(clientsData.find((c: any) => c.id === orderData.client_id))
      setEquipment(equipmentData)
      setMedia(mediaData)
      setTimeline(timelineData)
    } catch (error) {
      console.error('Error loading portal data:', error)
      toast({
        title: 'Erro ao carregar',
        description: 'Ordem de serviço não encontrada.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const openWhatsApp = () => {
    if (!client?.telefone) return
    const message = encodeURIComponent(`Olá! Gostaria de falar sobre a Ordem de Serviço ${order.number}`)
    window.open(`https://wa.me/${client.telefone.replace(/\D/g, '')}?text=${message}`, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Ordem de serviço não encontrada</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ordem de Serviço</h1>
          <p className="text-4xl font-black text-gray-900">{order.number}</p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
                  {order.status}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Cliente</p>
                <p className="font-medium">{client?.nome}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Data de Entrada</p>
                <p className="font-medium">{new Date(order.entry_date).toLocaleDateString('pt-BR')}</p>
              </div>
              {order.expected_delivery_date && (
                <div>
                  <p className="text-gray-600">Previsão de Entrega</p>
                  <p className="font-medium">{new Date(order.expected_delivery_date).toLocaleDateString('pt-BR')}</p>
                </div>
              )}
            </div>
            {order.technician && (
              <div className="mt-4">
                <p className="text-gray-600 text-sm">Técnico Responsável</p>
                <p className="font-medium">{order.technician}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="info">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="equipment">Equipamentos</TabsTrigger>
            <TabsTrigger value="media">Fotos</TabsTrigger>
            <TabsTrigger value="timeline">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4">
            <div className="space-y-4">
              {order.customer_defect && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Defeito Informado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{order.customer_defect}</p>
                  </CardContent>
                </Card>
              )}

              {order.service_executed && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Serviço Executado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{order.service_executed}</p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Valores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {order.parts_value > 0 && (
                      <div className="flex justify-between">
                        <span>Peças</span>
                        <span>R$ {order.parts_value.toFixed(2)}</span>
                      </div>
                    )}
                    {order.labor_value > 0 && (
                      <div className="flex justify-between">
                        <span>Mão de Obra</span>
                        <span>R$ {order.labor_value.toFixed(2)}</span>
                      </div>
                    )}
                    {order.shipping_value > 0 && (
                      <div className="flex justify-between">
                        <span>Frete</span>
                        <span>R$ {order.shipping_value.toFixed(2)}</span>
                      </div>
                    )}
                    {order.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Desconto</span>
                        <span>- R$ {order.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span>R$ {order.total_value.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {order.warranty && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Garantia</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{order.warranty}</p>
                    {order.warranty_term && (
                      <p className="text-gray-600 mt-2">Prazo: {order.warranty_term}</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="equipment" className="mt-4">
            <div className="space-y-4">
              {equipment.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-gray-500">
                    Nenhum equipamento cadastrado
                  </CardContent>
                </Card>
              ) : (
                equipment.map(eq => (
                  <Card key={eq.id}>
                    <CardContent className="pt-6">
                      <h3 className="font-medium text-lg mb-2">{eq.category}</h3>
                      {eq.brand && eq.model && (
                        <p className="text-gray-600 mb-2">{eq.brand} {eq.model}</p>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {eq.serial_number && (
                          <div>
                            <span className="text-gray-500">Número de Série:</span> {eq.serial_number}
                          </div>
                        )}
                        {eq.color && (
                          <div>
                            <span className="text-gray-500">Cor:</span> {eq.color}
                          </div>
                        )}
                        {eq.physical_condition && (
                          <div className="col-span-2">
                            <span className="text-gray-500">Estado Físico:</span> {eq.physical_condition}
                          </div>
                        )}
                      </div>
                      {eq.accessories && eq.accessories.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-500 mb-1">Acessórios:</p>
                          <div className="flex flex-wrap gap-1">
                            {eq.accessories.map((acc: string) => (
                              <span key={acc} className="px-2 py-0.5 bg-gray-100 rounded text-xs">{acc}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="media" className="mt-4">
            {['Entrada', 'Durante o Reparo', 'Saída'].map(stage => {
              const stageMedia = media.filter(m => m.stage === stage)
              if (stageMedia.length === 0) return null
              
              return (
                <Card key={stage} className="mb-4">
                  <CardHeader>
                    <CardTitle className="text-lg">{stage}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {stageMedia.map(m => (
                        <div key={m.id}>
                          {m.file_type === 'image' ? (
                            <img src={m.file_url} alt={m.file_name} className="w-full h-40 object-cover rounded-lg" />
                          ) : (
                            <video src={m.file_url} controls className="w-full h-40 object-cover rounded-lg" />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {media.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  Nenhuma foto ou vídeo disponível
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                {timeline.length === 0 ? (
                  <div className="text-center text-gray-500">Nenhuma entrada no histórico</div>
                ) : (
                  <div className="space-y-4">
                    {timeline.map((entry, index) => (
                      <div key={entry.id} className="flex gap-4">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <p>{entry.action}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(entry.timestamp).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {client?.telefone && (
          <div className="mt-8 text-center">
            <Button size="lg" onClick={openWhatsApp}>
              <MessageCircle className="w-4 h-4 mr-2" />
              Conversar via WhatsApp
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
