'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  ArrowLeft, Save, Plus, Trash2, Upload, FileText
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useData } from '@/hooks/use-data'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

const STATUS_OPTIONS = [
  'Recebido', 'Em análise', 'Aguardando orçamento', 'Orçamento enviado',
  'Aguardando aprovação', 'Aguardando peças', 'Em reparo', 'Em testes',
  'Finalizado', 'Pronto para retirada', 'Entregue', 'Cancelado', 'Garantia'
]

const PRIORITY_OPTIONS = ['Normal', 'Urgente', 'Emergencial']
const ORIGIN_OPTIONS = ['Loja', 'WhatsApp', 'Site', 'Telefone', 'Mercado Livre', 'Outro']

const EQUIPMENT_CATEGORIES = [
  'Computador Gamer', 'Computador Corporativo', 'Notebook', 'Mini PC', 'Servidor',
  'Video Game', 'Controle de Video Game', 'Celular', 'Tablet', 'Monitor',
  'Placa de Vídeo', 'Placa-Mãe', 'Fonte', 'Impressora', 'Outro'
]

const ACCESSORY_OPTIONS = [
  'Fonte', 'Cabo HDMI', 'Cabo de Energia', 'Mouse', 'Teclado', 'Controle',
  'Carregador', 'Bolsa', 'Case', 'Cartão de Memória', 'Outro'
]

const CHECKLISTS: Record<string, string[]> = {
  'Notebook': ['Liga', 'Tela', 'Touchpad', 'Webcam', 'USB', 'HDMI', 'Wi-Fi', 'Bluetooth', 'Som'],
  'Video Game': ['Liga', 'HDMI', 'USB', 'Lê Disco', 'Rede', 'Controle sincroniza'],
  'Celular': ['Liga', 'Touch', 'Face ID', 'Digital', 'Microfone', 'Alto Falante', 'Câmeras', 'Carrega', 'Fotos e Vídeos']
}

export default function ServiceOrderFormPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { 
    fetchServiceOrders, getServiceOrderById, saveServiceOrder,
    fetchClients, fetchServiceEquipment, saveServiceEquipment, deleteServiceEquipment,
    fetchServiceParts, saveServicePart, deleteServicePart,
    fetchServiceChecklists, saveServiceChecklist,
    fetchServiceTimeline, addTimelineEntry,
    fetchServiceMedia, saveServiceMedia, deleteServiceMedia,
    uploadImage
  } = useData()

  const isNew = params.id === 'new'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [order, setOrder] = useState<any>({
    number: '',
    client_id: '',
    entry_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    technician: '',
    priority: 'Normal',
    origin: 'Loja',
    status: 'Recebido',
    customer_defect: '',
    technical_diagnosis: '',
    service_executed: '',
    parts_value: 0,
    labor_value: 0,
    discount: 0,
    shipping_value: 0,
    total_value: 0,
    payment_method: '',
    installments: 1,
    payment_status: '',
    warranty: '',
    warranty_term: '',
    portal_token: crypto.randomUUID()
  })

  const [clients, setClients] = useState<any[]>([])
  const [equipment, setEquipment] = useState<any[]>([])
  const [parts, setParts] = useState<any[]>([])
  const [checklists, setChecklists] = useState<any[]>([])
  const [timeline, setTimeline] = useState<any[]>([])
  const [media, setMedia] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('info')

  // New Equipment Form
  const [newEquipment, setNewEquipment] = useState<any>({
    category: '',
    brand: '',
    model: '',
    serial_number: '',
    imei: '',
    color: '',
    processor: '',
    ram: '',
    storage: '',
    operating_system: '',
    password: '',
    physical_condition: '',
    observations: '',
    accessories: []
  })

  // New Part Form
  const [newPart, setNewPart] = useState<any>({
    part_name: '',
    quantity: 1,
    unit_price: 0,
    total_price: 0
  })

  // Media
  const [mediaStage, setMediaStage] = useState<'Entrada' | 'Durante o Reparo' | 'Saída'>('Entrada')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Signatures
  const [showSignatureDialog, setShowSignatureDialog] = useState<'entrada' | 'saida' | null>(null)
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    loadData()
  }, [params.id])

  useEffect(() => {
    const total = (order.parts_value || 0) + (order.labor_value || 0) + (order.shipping_value || 0) - (order.discount || 0)
    setOrder(prev => ({ ...prev, total_value: Math.max(0, total) }))
  }, [order.parts_value, order.labor_value, order.shipping_value, order.discount])

  const loadData = async () => {
    try {
      const clientsData = await fetchClients()
      setClients(clientsData)

      if (!isNew) {
        const orderData = await getServiceOrderById(params.id as string)
        setOrder(orderData)
        
        const [equipmentData, partsData, checklistsData, timelineData, mediaData] = await Promise.all([
          fetchServiceEquipment(orderData.id),
          fetchServiceParts(orderData.id),
          fetchServiceChecklists(orderData.id),
          fetchServiceTimeline(orderData.id),
          fetchServiceMedia(orderData.id)
        ])
        
        setEquipment(equipmentData)
        setParts(partsData)
        setChecklists(checklistsData)
        setTimeline(timelineData)
        setMedia(mediaData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar a ordem de serviço.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const generateOrderNumber = async () => {
    try {
      const orders = await fetchServiceOrders()
      const nextNumber = orders.length + 1
      return `OS-${String(nextNumber).padStart(6, '0')}`
    } catch {
      return `OS-${String(Date.now()).slice(-6)}`
    }
  }

  const handleSave = async () => {
    if (!order.client_id) {
      toast({ title: 'Cliente obrigatório', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      let orderNumber = order.number
      if (isNew && !orderNumber) {
        orderNumber = await generateOrderNumber()
      }

      const savedOrder = await saveServiceOrder({
        ...order,
        id: isNew ? undefined : order.id,
        number: orderNumber,
        updated_at: new Date().toISOString()
      })

      if (isNew) {
        await addTimelineEntry({
          service_order_id: savedOrder.id,
          action: 'Ordem de serviço criada',
          user_name: 'Sistema',
          timestamp: new Date().toISOString()
        })
        router.push(`/os/${savedOrder.id}`)
      } else {
        setOrder(savedOrder)
      }

      toast({ title: isNew ? 'Ordem de serviço criada' : 'Ordem de serviço atualizada' })
    } catch (error) {
      console.error('Error saving order:', error)
      toast({
        title: 'Erro ao salvar',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAddEquipment = async () => {
    if (!newEquipment.category) {
      toast({ title: 'Categoria obrigatória', variant: 'destructive' })
      return
    }

    try {
      const saved = await saveServiceEquipment({
        ...newEquipment,
        service_order_id: order.id
      })
      setEquipment([...equipment, saved])
      setNewEquipment({
        category: '',
        brand: '',
        model: '',
        serial_number: '',
        imei: '',
        color: '',
        processor: '',
        ram: '',
        storage: '',
        operating_system: '',
        password: '',
        physical_condition: '',
        observations: '',
        accessories: []
      })
      toast({ title: 'Equipamento adicionado' })
    } catch (error) {
      console.error('Error adding equipment:', error)
      toast({ title: 'Erro ao adicionar equipamento', variant: 'destructive' })
    }
  }

  const handleRemoveEquipment = async (id: string) => {
    try {
      await deleteServiceEquipment(id)
      setEquipment(equipment.filter(e => e.id !== id))
      toast({ title: 'Equipamento removido' })
    } catch (error) {
      console.error('Error removing equipment:', error)
      toast({ title: 'Erro ao remover equipamento', variant: 'destructive' })
    }
  }

  const handleAddPart = async () => {
    if (!newPart.part_name || newPart.unit_price <= 0) {
      toast({ title: 'Preencha os dados da peça', variant: 'destructive' })
      return
    }

    const total = newPart.quantity * newPart.unit_price
    try {
      const saved = await saveServicePart({
        ...newPart,
        total_price: total,
        service_order_id: order.id
      })
      setParts([...parts, saved])
      setNewPart({ part_name: '', quantity: 1, unit_price: 0, total_price: 0 })
      
      const newPartsValue = parts.reduce((sum, p) => sum + (p.total_price || 0), 0) + total
      setOrder(prev => ({ ...prev, parts_value: newPartsValue }))
      
      toast({ title: 'Peça adicionada' })
    } catch (error) {
      console.error('Error adding part:', error)
      toast({ title: 'Erro ao adicionar peça', variant: 'destructive' })
    }
  }

  const handleRemovePart = async (id: string) => {
    try {
      await deleteServicePart(id)
      const newParts = parts.filter(p => p.id !== id)
      setParts(newParts)
      
      const newPartsValue = newParts.reduce((sum, p) => sum + (p.total_price || 0), 0)
      setOrder(prev => ({ ...prev, parts_value: newPartsValue }))
      
      toast({ title: 'Peça removida' })
    } catch (error) {
      console.error('Error removing part:', error)
      toast({ title: 'Erro ao remover peça', variant: 'destructive' })
    }
  }

  const getChecklistTemplate = (category: string) => {
    return CHECKLISTS[category] || ['Liga', 'Carrega', 'Imagem', 'Som', 'Conectividade', 'Estado físico']
  }

  const handleToggleChecklistItem = async (equipmentItem: any, itemLabel: string, checked: boolean) => {
    const existingChecklist = checklists.find((entry) => entry.equipment_category === equipmentItem.category)
    const currentItems = Array.isArray(existingChecklist?.items) ? existingChecklist.items : []
    const existingItem = currentItems.find((item: any) => item.label === itemLabel)

    const nextItems = currentItems.length > 0
      ? currentItems.map((item: any) => item.label === itemLabel ? { ...item, checked } : item)
      : getChecklistTemplate(equipmentItem.category).map((label) => ({
          label,
          checked: label === itemLabel ? checked : false,
        }))

    if (!existingItem && currentItems.length > 0) {
      nextItems.push({ label: itemLabel, checked })
    }

    try {
      const savedChecklist = await saveServiceChecklist({
        id: existingChecklist?.id,
        service_order_id: order.id,
        equipment_category: equipmentItem.category,
        items: nextItems,
      })

      setChecklists((prev) => {
        const remaining = prev.filter((entry) => entry.id !== savedChecklist.id && entry.equipment_category !== equipmentItem.category)
        return [...remaining, savedChecklist]
      })

      toast({ title: 'Checklist atualizado' })
    } catch (error) {
      console.error('Error saving checklist:', error)
      toast({ title: 'Erro ao salvar checklist', variant: 'destructive' })
    }
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const url = await uploadImage(file)
        const saved = await saveServiceMedia({
          service_order_id: order.id,
          stage: mediaStage,
          file_url: url,
          file_type: file.type.startsWith('image') ? 'image' : 'video',
          file_name: file.name,
          order_index: media.length + i
        })
        setMedia([...media, saved])
      } catch (error) {
        console.error('Error uploading file:', error)
      }
    }
    toast({ title: 'Arquivos enviados' })
  }

  const handleRemoveMedia = async (id: string) => {
    try {
      await deleteServiceMedia(id)
      setMedia(media.filter(m => m.id !== id))
      toast({ title: 'Arquivo removido' })
    } catch (error) {
      console.error('Error removing media:', error)
      toast({ title: 'Erro ao remover arquivo', variant: 'destructive' })
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    setOrder(prev => ({ ...prev, status: newStatus }))
    
    if (!isNew) {
      try {
        const entry = await addTimelineEntry({
          service_order_id: order.id,
          action: `Status alterado para: ${newStatus}`,
          user_name: 'Usuário',
          timestamp: new Date().toISOString()
        })
        setTimeline([...timeline, entry])
      } catch (error) {
        console.error('Error adding timeline entry:', error)
      }
    }
  }

  // Signature Functions
  const initSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = signatureCanvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    let x, y
    if ('touches' in e) {
      x = (e.touches[0].clientX - rect.left) * scaleX
      y = (e.touches[0].clientY - rect.top) * scaleY
    } else {
      x = (e.clientX - rect.left) * scaleX
      y = (e.clientY - rect.top) * scaleY
    }
    
    setIsDrawing(true)
    setLastPosition({ x, y })
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(x, y)
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!isDrawing) return
    const canvas = signatureCanvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    let x, y
    if ('touches' in e) {
      x = (e.touches[0].clientX - rect.left) * scaleX
      y = (e.touches[0].clientY - rect.top) * scaleY
    } else {
      x = (e.clientX - rect.left) * scaleX
      y = (e.clientY - rect.top) * scaleY
    }
    
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.lineTo(x, y)
      ctx.stroke()
    }
    setLastPosition({ x, y })
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const saveSignature = async () => {
    const canvas = signatureCanvasRef.current
    if (!canvas || !showSignatureDialog) return
    
    const dataUrl = canvas.toDataURL('image/png')
    const res = await fetch(dataUrl)
    const blob = await res.blob()
    const file = new File([blob], `signature-${showSignatureDialog}.png`, { type: 'image/png' })
    const url = await uploadImage(file)
    
    if (showSignatureDialog === 'entrada') {
      setOrder(prev => ({ ...prev, entry_signature: url }))
    } else {
      setOrder(prev => ({ ...prev, exit_signature: url }))
    }
    
    setShowSignatureDialog(null)
    toast({ title: 'Assinatura salva' })
  }

  const generatePDF = async () => {
    const element = document.getElementById('os-pdf')
    if (!element) return

    try {
      toast({ title: 'Gerando PDF...' })

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)

      pdf.addImage(
        imgData,
        'JPEG',
        (pdfWidth - imgWidth * ratio) / 2,
        8,
        imgWidth * ratio,
        imgHeight * ratio
      )
      pdf.save(`${order.number || 'ordem-servico'}.pdf`)

      toast({ title: 'PDF gerado com sucesso' })
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({ title: 'Erro ao gerar PDF', variant: 'destructive' })
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
      <div id="os-pdf" className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => router.push('/os')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isNew ? 'Nova Ordem de Serviço' : `Ordem de Serviço ${order.number}`}
            </h1>
          </div>
          {!isNew && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={generatePDF}>
                <FileText className="w-4 h-4 mr-2" />
                Gerar PDF
              </Button>
            </div>
          )}
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>

        {!isNew && (
          <div className="mb-6 flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map(status => (
              <Button
                key={status}
                variant={order.status === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusChange(status)}
              >
                {status}
              </Button>
            ))}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="equipment">Equipamentos</TabsTrigger>
            <TabsTrigger value="parts">Peças</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="media">Mídia</TabsTrigger>
            <TabsTrigger value="timeline">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dados Básicos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label>Número OS</Label>
                      <Input value={order.number} disabled placeholder="Gerado automaticamente" />
                    </div>
                    <div>
                      <Label>Cliente *</Label>
                      <Select value={order.client_id} onValueChange={(v) => setOrder(prev => ({ ...prev, client_id: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map(client => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Data de Entrada</Label>
                      <Input 
                        type="date" 
                        value={order.entry_date?.split('T')[0]} 
                        onChange={(e) => setOrder(prev => ({ ...prev, entry_date: e.target.value }))} 
                      />
                    </div>
                    <div>
                      <Label>Previsão de Entrega</Label>
                      <Input 
                        type="date" 
                        value={order.expected_delivery_date?.split('T')[0]} 
                        onChange={(e) => setOrder(prev => ({ ...prev, expected_delivery_date: e.target.value }))} 
                      />
                    </div>
                    <div>
                      <Label>Técnico Responsável</Label>
                      <Input 
                        value={order.technician} 
                        onChange={(e) => setOrder(prev => ({ ...prev, technician: e.target.value }))} 
                      />
                    </div>
                    <div>
                      <Label>Prioridade</Label>
                      <Select value={order.priority} onValueChange={(v) => setOrder(prev => ({ ...prev, priority: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PRIORITY_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Origem</Label>
                      <Select value={order.origin} onValueChange={(v) => setOrder(prev => ({ ...prev, origin: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ORIGIN_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Descrição do Serviço</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Defeito Informado pelo Cliente</Label>
                    <Textarea 
                      value={order.customer_defect} 
                      onChange={(e) => setOrder(prev => ({ ...prev, customer_defect: e.target.value }))}
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label>Diagnóstico Técnico</Label>
                    <Textarea 
                      value={order.technical_diagnosis} 
                      onChange={(e) => setOrder(prev => ({ ...prev, technical_diagnosis: e.target.value }))}
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label>Serviço Executado</Label>
                    <Textarea 
                      value={order.service_executed} 
                      onChange={(e) => setOrder(prev => ({ ...prev, service_executed: e.target.value }))}
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Valores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label>Valor das Peças</Label>
                      <Input 
                        type="number" 
                        value={order.parts_value} 
                        onChange={(e) => setOrder(prev => ({ ...prev, parts_value: parseFloat(e.target.value) || 0 }))} 
                      />
                    </div>
                    <div>
                      <Label>Valor da Mão de Obra</Label>
                      <Input 
                        type="number" 
                        value={order.labor_value} 
                        onChange={(e) => setOrder(prev => ({ ...prev, labor_value: parseFloat(e.target.value) || 0 }))} 
                      />
                    </div>
                    <div>
                      <Label>Desconto</Label>
                      <Input 
                        type="number" 
                        value={order.discount} 
                        onChange={(e) => setOrder(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))} 
                      />
                    </div>
                    <div>
                      <Label>Frete</Label>
                      <Input 
                        type="number" 
                        value={order.shipping_value} 
                        onChange={(e) => setOrder(prev => ({ ...prev, shipping_value: parseFloat(e.target.value) || 0 }))} 
                      />
                    </div>
                    <div>
                      <Label>Valor Total</Label>
                      <Input value={order.total_value} disabled />
                    </div>
                    <div>
                      <Label>Forma de Pagamento</Label>
                      <Input 
                        value={order.payment_method} 
                        onChange={(e) => setOrder(prev => ({ ...prev, payment_method: e.target.value }))} 
                      />
                    </div>
                    <div>
                      <Label>Parcelas</Label>
                      <Input 
                        type="number" 
                        value={order.installments} 
                        onChange={(e) => setOrder(prev => ({ ...prev, installments: parseInt(e.target.value) || 1 }))} 
                      />
                    </div>
                    <div>
                      <Label>Status do Pagamento</Label>
                      <Input 
                        value={order.payment_status} 
                        onChange={(e) => setOrder(prev => ({ ...prev, payment_status: e.target.value }))} 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Garantia</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Garantia</Label>
                    <Textarea 
                      value={order.warranty} 
                      onChange={(e) => setOrder(prev => ({ ...prev, warranty: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Prazo da Garantia</Label>
                    <Input 
                      value={order.warranty_term} 
                      onChange={(e) => setOrder(prev => ({ ...prev, warranty_term: e.target.value }))} 
                    />
                  </div>
                </CardContent>
              </Card>

              {!isNew && (
                <Card>
                  <CardHeader>
                    <CardTitle>Assinaturas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="text-center">
                        <h4 className="font-medium mb-2">Assinatura de Entrada</h4>
                        {order.entry_signature ? (
                          <img src={order.entry_signature} alt="Assinatura de entrada" className="mx-auto h-32 border rounded" />
                        ) : (
                          <div className="h-32 border rounded flex items-center justify-center text-gray-400">
                            Sem assinatura
                          </div>
                        )}
                        <Button 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => {
                            setShowSignatureDialog('entrada')
                            setTimeout(initSignatureCanvas, 100)
                          }}
                        >
                          {order.entry_signature ? 'Reassinar' : 'Assinar'}
                        </Button>
                      </div>
                      <div className="text-center">
                        <h4 className="font-medium mb-2">Assinatura de Saída</h4>
                        {order.exit_signature ? (
                          <img src={order.exit_signature} alt="Assinatura de saída" className="mx-auto h-32 border rounded" />
                        ) : (
                          <div className="h-32 border rounded flex items-center justify-center text-gray-400">
                            Sem assinatura
                          </div>
                        )}
                        <Button 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => {
                            setShowSignatureDialog('saida')
                            setTimeout(initSignatureCanvas, 100)
                          }}
                        >
                          {order.exit_signature ? 'Reassinar' : 'Assinar'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="equipment">
            <div className="grid gap-6">
              {!isNew && (
                <Card>
                  <CardHeader>
                    <CardTitle>Adicionar Equipamento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label>Categoria *</Label>
                        <Select value={newEquipment.category} onValueChange={(v) => setNewEquipment(prev => ({ ...prev, category: v }))}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {EQUIPMENT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Marca</Label>
                        <Input value={newEquipment.brand} onChange={(e) => setNewEquipment(prev => ({ ...prev, brand: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Modelo</Label>
                        <Input value={newEquipment.model} onChange={(e) => setNewEquipment(prev => ({ ...prev, model: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Número de Série</Label>
                        <Input value={newEquipment.serial_number} onChange={(e) => setNewEquipment(prev => ({ ...prev, serial_number: e.target.value }))} />
                      </div>
                      <div>
                        <Label>IMEI</Label>
                        <Input value={newEquipment.imei} onChange={(e) => setNewEquipment(prev => ({ ...prev, imei: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Cor</Label>
                        <Input value={newEquipment.color} onChange={(e) => setNewEquipment(prev => ({ ...prev, color: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Processador</Label>
                        <Input value={newEquipment.processor} onChange={(e) => setNewEquipment(prev => ({ ...prev, processor: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Memória RAM</Label>
                        <Input value={newEquipment.ram} onChange={(e) => setNewEquipment(prev => ({ ...prev, ram: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Armazenamento</Label>
                        <Input value={newEquipment.storage} onChange={(e) => setNewEquipment(prev => ({ ...prev, storage: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Sistema Operacional</Label>
                        <Input value={newEquipment.operating_system} onChange={(e) => setNewEquipment(prev => ({ ...prev, operating_system: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Senha Informada</Label>
                        <Input type="password" value={newEquipment.password} onChange={(e) => setNewEquipment(prev => ({ ...prev, password: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Estado Físico</Label>
                        <Input value={newEquipment.physical_condition} onChange={(e) => setNewEquipment(prev => ({ ...prev, physical_condition: e.target.value }))} />
                      </div>
                      <div className="col-span-full">
                        <Label>Observações</Label>
                        <Textarea value={newEquipment.observations} onChange={(e) => setNewEquipment(prev => ({ ...prev, observations: e.target.value }))} />
                      </div>
                      <div className="col-span-full">
                        <Label>Acessórios Entregues</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                          {ACCESSORY_OPTIONS.map(acc => (
                            <div key={acc} className="flex items-center gap-2">
                              <Checkbox 
                                id={`acc-${acc}`}
                                checked={newEquipment.accessories.includes(acc)}
                                onCheckedChange={(checked) => {
                                  setNewEquipment(prev => ({
                                    ...prev,
                                    accessories: checked 
                                      ? [...prev.accessories, acc] 
                                      : prev.accessories.filter(a => a !== acc)
                                  }))
                                }}
                              />
                              <label htmlFor={`acc-${acc}`} className="text-sm">{acc}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Button onClick={handleAddEquipment}>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Equipamento
                    </Button>
                  </CardContent>
                </Card>
              )}

              {equipment.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Equipamentos Cadastrados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {equipment.map(eq => (
                        <div key={eq.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium">{eq.category} - {eq.brand} {eq.model}</h4>
                              <p className="text-sm text-gray-500">Número de Série: {eq.serial_number || 'N/A'}</p>
                            </div>
                            <Button variant="destructive" size="sm" onClick={() => handleRemoveEquipment(eq.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          {eq.accessories && eq.accessories.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium">Acessórios:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {eq.accessories.map((acc: string) => (
                                  <span key={acc} className="px-2 py-0.5 bg-gray-100 rounded text-xs">{acc}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {eq.physical_condition && (
                            <p className="text-sm mt-2">Estado Físico: {eq.physical_condition}</p>
                          )}
                          {eq.observations && (
                            <p className="text-sm mt-1 text-gray-600">Obs: {eq.observations}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="parts">
            <div className="grid gap-6">
              {!isNew && (
                <Card>
                  <CardHeader>
                    <CardTitle>Adicionar Peça</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <Label>Peça</Label>
                        <Input value={newPart.part_name} onChange={(e) => setNewPart(prev => ({ ...prev, part_name: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Quantidade</Label>
                        <Input 
                          type="number" 
                          value={newPart.quantity} 
                          onChange={(e) => {
                            const qty = parseInt(e.target.value) || 1
                            setNewPart(prev => ({ 
                              ...prev, 
                              quantity: qty,
                              total_price: qty * prev.unit_price 
                            }))
                          }} 
                        />
                      </div>
                      <div>
                        <Label>Valor Unitário</Label>
                        <Input 
                          type="number" 
                          value={newPart.unit_price} 
                          onChange={(e) => {
                            const price = parseFloat(e.target.value) || 0
                            setNewPart(prev => ({ 
                              ...prev, 
                              unit_price: price,
                              total_price: prev.quantity * price 
                            }))
                          }} 
                        />
                      </div>
                      <div>
                        <Label>Valor Total</Label>
                        <Input value={newPart.total_price} disabled />
                      </div>
                    </div>
                    <Button onClick={handleAddPart}>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Peça
                    </Button>
                  </CardContent>
                </Card>
              )}

              {parts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Peças Utilizadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Peça</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead>Valor Unitário</TableHead>
                          <TableHead>Valor Total</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parts.map(part => (
                          <TableRow key={part.id}>
                            <TableCell>{part.part_name}</TableCell>
                            <TableCell>{part.quantity}</TableCell>
                            <TableCell>{part.unit_price}</TableCell>
                            <TableCell>{part.total_price}</TableCell>
                            <TableCell>
                              <Button variant="destructive" size="sm" onClick={() => handleRemovePart(part.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="checklist">
            <div className="grid gap-6">
              {isNew ? (
                <Card>
                  <CardContent className="pt-6 text-sm text-gray-500">
                    Salve a OS primeiro para habilitar o checklist técnico.
                  </CardContent>
                </Card>
              ) : equipment.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-sm text-gray-500">
                    Adicione ao menos um equipamento para montar o checklist.
                  </CardContent>
                </Card>
              ) : (
                equipment.map((equipmentItem) => {
                  const savedChecklist = checklists.find(
                    (entry) => entry.equipment_category === equipmentItem.category
                  )
                  const checklistItems = (savedChecklist?.items?.length
                    ? savedChecklist.items
                    : getChecklistTemplate(equipmentItem.category).map((label) => ({
                        label,
                        checked: false,
                      }))) as Array<{ label: string; checked: boolean }>

                  return (
                    <Card key={equipmentItem.id}>
                      <CardHeader>
                        <CardTitle>
                          Checklist: {equipmentItem.category} {equipmentItem.brand ? `- ${equipmentItem.brand}` : ""}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {checklistItems.map((item) => (
                            <label key={item.label} className="flex items-center gap-3 rounded-md border p-3">
                              <Checkbox
                                checked={item.checked}
                                onCheckedChange={(checked) =>
                                  handleToggleChecklistItem(equipmentItem, item.label, checked === true)
                                }
                              />
                              <span className="text-sm">{item.label}</span>
                            </label>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="media">
            <div className="grid gap-6">
              {!isNew && (
                <Card>
                  <CardHeader>
                    <CardTitle>Enviar Mídia</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <Label>Etapa</Label>
                      <Select value={mediaStage} onValueChange={(v: any) => setMediaStage(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Entrada">Entrada</SelectItem>
                          <SelectItem value="Durante o Reparo">Durante o Reparo</SelectItem>
                          <SelectItem value="Saída">Saída</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div 
                      className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-600">Clique ou arraste arquivos para enviar</p>
                      <input 
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFileUpload(e.target.files)}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Galeria</CardTitle>
                </CardHeader>
                <CardContent>
                  {['Entrada', 'Durante o Reparo', 'Saída'].map(stage => {
                    const stageMedia = media.filter(m => m.stage === stage)
                    if (stageMedia.length === 0) return null
                    
                    return (
                      <div key={stage} className="mb-6">
                        <h4 className="font-medium mb-3">{stage}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {stageMedia.map(m => (
                            <div key={m.id} className="relative group">
                              {m.file_type === 'image' ? (
                                <img src={m.file_url} alt={m.file_name} className="w-full h-32 object-cover rounded" />
                              ) : (
                                <video src={m.file_url} className="w-full h-32 object-cover rounded" />
                              )}
                              {!isNew && (
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                                  onClick={() => handleRemoveMedia(m.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Histórico</CardTitle>
              </CardHeader>
              <CardContent>
                {timeline.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Nenhuma entrada no histórico</div>
                ) : (
                  <div className="space-y-4">
                    {timeline.map((entry, index) => (
                      <div key={entry.id} className="flex gap-4">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-sm">{entry.action}</p>
                          <p className="text-xs text-gray-500">
                            {entry.user_name} - {new Date(entry.timestamp).toLocaleString('pt-BR')}
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
      </div>

      <Dialog open={!!showSignatureDialog} onOpenChange={() => setShowSignatureDialog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Assinar {showSignatureDialog === 'entrada' ? 'Entrega' : 'Retirada'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <canvas
              ref={signatureCanvasRef}
              width={400}
              height={200}
              className="border rounded w-full touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={clearSignature}>Limpar</Button>
              <Button onClick={saveSignature}>Salvar Assinatura</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
