"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Plus,
  Trash2,
  Save,
  FileDown,
  Printer,
  Copy,
  Search,
  Eye,
  Calendar,
  Youtube,
  Instagram,
  Upload,
  X,
  FileText,
  History,
  Settings,
  Menu,
  ChevronLeft,
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Lock,
  LogIn,
  Link,
  Loader2,
  CheckCircle,
  Wrench,
  ArrowLeft,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useData } from "@/hooks/use-data"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import { supabase } from "@/lib/supabase"
import { QRCodeSVG } from "qrcode.react"

interface Item {
  id: string
  descricao: string
  valor: number
}

interface Cliente {
  nome: string
  telefone: string
}

interface Orcamento {
  id: string
  numero: string
  cliente: Cliente
  itens: Item[]
  total: number
  data: string
  hora: string
  moeda?: "BRL" | "USD"
  idioma?: "pt" | "en"
}

interface Contrato {
  id: string
  numero: string
  titulo?: string
  contratante: {
    nome: string
    cpfCnpj: string
    endereco: string
    telefone: string
    email: string
  }
  contratado: {
    nome: string
    cpfCnpj: string
    endereco: string
    telefone: string
    email: string
  }
  objeto: string
  valor: number
  prazoExecucao: string
  formaPagamento: string
  clausulas: string[]
  data: string
  hora: string
  moeda?: "BRL" | "USD"
  idioma?: "pt" | "en"
  clientSignature?: string
  clientSignedAt?: string
  status?: string
  paidAt?: string
}

interface ClienteCadastro {
  id: string
  nome: string
  cpfCnpj: string
  endereco: string
  telefone: string
  email: string
}

export default function OrcamentoPage() {
  // UUID generator with fallback for environments without crypto.randomUUID
  const generateUUID = () => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID()
    }
    // Fallback implementation (RFC4122 version 4 compliant)
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === "x" ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  const [cliente, setCliente] = useState<Cliente>({ nome: "", telefone: "" })
  const [itens, setItens] = useState<Item[]>([])
  const [itensSalvos, setItensSalvos] = useState<Item[]>([])
  const [itemSelecionado, setItemSelecionado] = useState<string>("")
  const [showEditItensSalvos, setShowEditItensSalvos] = useState<boolean>(false)
  const [orcamentoGerado, setOrcamentoGerado] = useState<boolean>(false)
  const [numeroOrcamento, setNumeroOrcamento] = useState<string>("")
  const [dataOrcamento, setDataOrcamento] = useState<string>("")
  const [horaOrcamento, setHoraOrcamento] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("orcamento")
  const [historico, setHistorico] = useState<Orcamento[]>([])
  const [orcamentoSelecionado, setOrcamentoSelecionado] = useState<Orcamento | null>(null)
  const [filtroHistorico, setFiltroHistorico] = useState<string>("")
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true)

  // OS State
  const [osView, setOsView] = useState<"list" | "form">("list")
  const [osFilter, setOsFilter] = useState<string>("")
  const [serviceOrders, setServiceOrders] = useState<any[]>([])
  const [osLoading, setOsLoading] = useState<boolean>(true)
  const [currentOsId, setCurrentOsId] = useState<string | null>(null)
  const [osForm, setOsForm] = useState<any>({
    number: "",
    client_id: "",
    entry_date: new Date().toISOString().split("T")[0],
    expected_delivery_date: "",
    technician: "",
    priority: "Normal",
    origin: "Loja",
    status: "Recebido",
    customer_defect: "",
    technical_diagnosis: "",
    service_executed: "",
    parts_value: 0,
    labor_value: 0,
    discount: 0,
    shipping_value: 0,
    total_value: 0,
    payment_method: "",
    installments: 1,
    payment_status: "",
    warranty: "",
    warranty_term: "",
    portal_token: generateUUID(),
    entry_signature: "",
    exit_signature: "",
  })
  const [osEquipment, setOsEquipment] = useState<any[]>([])
  const [osParts, setOsParts] = useState<any[]>([])
  const [osChecklists, setOsChecklists] = useState<any[]>([])
  const [osTimeline, setOsTimeline] = useState<any[]>([])
  const [osMedia, setOsMedia] = useState<any[]>([])
  const [osActiveTab, setOsActiveTab] = useState<string>("info")
  const [newOsEquipment, setNewOsEquipment] = useState<any>({
    category: "",
    brand: "",
    model: "",
    serial_number: "",
    imei: "",
    color: "",
    processor: "",
    ram: "",
    storage: "",
    operating_system: "",
    password: "",
    physical_condition: "",
    observations: "",
    accessories: [],
  })
  const [newOsPart, setNewOsPart] = useState<any>({
    part_name: "",
    quantity: 1,
    unit_price: 0,
    total_price: 0,
  })
  const [osMediaStage, setOsMediaStage] = useState<"Entrada" | "Durante o Reparo" | "Saída">("Entrada")
  const [osShowSignatureDialog, setOsShowSignatureDialog] = useState<"entrada" | "saida" | null>(null)
  const [osSignatureCanvasRef, setOsSignatureCanvasRef] = useState<HTMLCanvasElement | null>(null)
  const [osIsDrawing, setOsIsDrawing] = useState(false)
  const [osLastPosition, setOsLastPosition] = useState({ x: 0, y: 0 })
  const [osPdfRef, setOsPdfRef] = useState<HTMLDivElement | null>(null)
  const [osReceiptRef, setOsReceiptRef] = useState<HTMLDivElement | null>(null)

  // OS Constants
  const STATUS_OPTIONS = [
    "Recebido", "Em análise", "Aguardando orçamento", "Orçamento enviado",
    "Aguardando aprovação", "Aguardando peças", "Em reparo", "Em testes",
    "Finalizado", "Pronto para retirada", "Entregue", "Cancelado", "Garantia"
  ]
  const PRIORITY_OPTIONS = ["Normal", "Urgente", "Emergencial"]
  const ORIGIN_OPTIONS = ["Loja", "WhatsApp", "Site", "Telefone", "Mercado Livre", "Outro"]
  const EQUIPMENT_CATEGORIES = [
    "Computador Gamer", "Computador Corporativo", "Notebook", "Mini PC", "Servidor",
    "Video Game", "Controle de Video Game", "Celular", "Tablet", "Monitor",
    "Placa de Vídeo", "Placa-Mãe", "Fonte", "Impressora", "Outro"
  ]
  const ACCESSORY_OPTIONS = [
    "Fonte", "Cabo HDMI", "Cabo de Energia", "Mouse", "Teclado", "Controle",
    "Carregador", "Bolsa", "Case", "Cartão de Memória", "Outro"
  ]
  const CHECKLISTS: Record<string, string[]> = {
    "Notebook": ["Liga", "Tela", "Touchpad", "Webcam", "USB", "HDMI", "Wi-Fi", "Bluetooth", "Som"],
    "Video Game": ["Liga", "HDMI", "USB", "Lê Disco", "Rede", "Controle sincroniza"],
    "Celular": ["Liga", "Touch", "Face ID", "Digital", "Microfone", "Alto Falante", "Câmeras", "Carrega", "Fotos e Vídeos"]
  }
  const { toast } = useToast()
  const router = useRouter()
  const { 
    fetchProducts, saveProduct, deleteProduct,
    fetchClients, saveClient, deleteClient,
    fetchBudgets, saveBudget, deleteBudget,
    fetchContracts, saveContract, deleteContract, markContractPaid,
    fetchTransactions, saveTransaction, deleteTransaction,
    fetchAccounts, saveAccount, deleteAccount,
    fetchSettings, saveSettings,
    uploadImage,
    fetchServiceOrders,
    getServiceOrderById,
    getServiceOrderByToken,
    saveServiceOrder,
    deleteServiceOrder,
    fetchServiceEquipment,
    saveServiceEquipment,
    deleteServiceEquipment,
    fetchServiceParts,
    saveServicePart,
    deleteServicePart,
    fetchServiceChecklists,
    saveServiceChecklist,
    fetchServiceTimeline,
    addTimelineEntry,
    fetchServiceMedia,
    saveServiceMedia,
    deleteServiceMedia,
  } = useData()

  const [configuracoes, setConfiguracoes] = useState({
    nomeEmpresa: "Informática - Soluções em Tecnologia",
    whatsapp: "(16) 99381-7699",
    diasValidade: 7,
    logo: "/LOGON.png",
    slogan: "Informática - Soluções em Tecnologia",
    assinaturaContratado: "",
    dadosContratado: {
      nome: "",
      cpfCnpj: "",
      endereco: "",
      telefone: "",
      email: "",
    },
  })

  const [contratoAtual, setContratoAtual] = useState<Contrato>({
    id: "",
    numero: "",
    titulo: "",
    contratante: { nome: "", cpfCnpj: "", endereco: "", telefone: "", email: "" },
    contratado: { nome: "", cpfCnpj: "", endereco: "", telefone: "", email: "" },
    objeto: "",
    valor: 0,
    prazoExecucao: "",
    formaPagamento: "",
    clausulas: [],
    data: "",
    hora: "",
  })
  const [contratoGerado, setContratoGerado] = useState<boolean>(false)
  const [historicoContratos, setHistoricoContratos] = useState<Contrato[]>([])
  const [contratoSelecionado, setContratoSelecionado] = useState<Contrato | null>(null)
  const [filtroContratos, setFiltroContratos] = useState<string>("")
  const [filtroHistoricoContratos, setFiltroHistoricoContratos] = useState<string>("")
  const [novaClausula, setNovaClausula] = useState<string>("")

  const [clausulasPredefinidas] = useState([
    "DO OBJETO E ESCOPO: O CONTRATADO se compromete a executar os serviços de tecnologia da informação com competência técnica, utilizando metodologias ágeis e as melhores práticas do mercado, incluindo análise de requisitos, desenvolvimento, testes, documentação técnica e treinamento quando aplicável.",

    "DA CONFIDENCIALIDADE E SIGILO: O CONTRATADO obriga-se a manter absoluto sigilo sobre todas as informações, dados, códigos-fonte, documentos, processos de negócio e demais informações confidenciais do CONTRATANTE, não podendo divulgá-las a terceiros sob qualquer hipótese, mesmo após o término do contrato.",

    "DOS BACKUPS E SEGURANÇA: É de responsabilidade do CONTRATADO manter backup adequado e seguro de todos os trabalhos, códigos e documentos desenvolvidos durante a execução dos serviços, utilizando ferramentas de versionamento e armazenamento em nuvem com criptografia.",

    "DAS OBRIGAÇÕES DO CONTRATANTE: O CONTRATANTE deve fornecer todas as informações, especificações, acessos aos sistemas, credenciais necessárias e recursos de infraestrutura indispensáveis para a execução adequada dos serviços contratados, bem como designar um responsável técnico para acompanhamento.",

    "DAS ALTERAÇÕES DE ESCOPO: Qualquer alteração, inclusão ou exclusão no escopo dos serviços deve ser formalizada por escrito através de termo aditivo, podendo resultar em ajuste proporcional de prazo e valor, conforme complexidade das modificações solicitadas.",

    "DA GARANTIA E SUPORTE: O CONTRATADO oferece garantia de 90 (noventa) dias para correção de defeitos e bugs nos serviços prestados, sem custo adicional. Após este período, suporte técnico será cobrado conforme tabela de preços vigente.",

    "DA PROPRIEDADE INTELECTUAL: Os direitos autorais sobre códigos, sistemas e documentações desenvolvidos especificamente para o CONTRATANTE serão transferidos integralmente mediante quitação total do contrato. Códigos de terceiros e bibliotecas mantêm suas licenças originais.",

    "DAS LIMITAÇÕES DE RESPONSABILIDADE: O CONTRATADO não se responsabiliza por danos causados por uso inadequado dos sistemas, modificações não autorizadas, falhas de infraestrutura do cliente, ataques cibernéticos ou casos fortuitos e força maior.",

    "DO PRAZO E ENTREGA: Os prazos estabelecidos são estimativos e podem sofrer alterações devido a mudanças de escopo, indisponibilidade de recursos do CONTRATANTE ou fatores externos. Entregas serão realizadas em etapas conforme cronograma acordado.",

    "DA RESCISÃO E PAGAMENTOS: Em caso de rescisão antecipada por qualquer das partes, o CONTRATANTE deve quitar integralmente os serviços já executados, calculados proporcionalmente ao trabalho realizado e entregues até a data da rescisão.",

    "DO SUPORTE TÉCNICO: Após a entrega final, o CONTRATADO disponibilizará suporte técnico para esclarecimento de dúvidas sobre o funcionamento dos sistemas por período de 30 (trinta) dias, via e-mail ou telefone, em horário comercial.",

    "DA METODOLOGIA DE TRABALHO: Os serviços serão executados seguindo metodologias ágeis (Scrum/Kanban), com entregas incrementais, reuniões de acompanhamento semanais e relatórios de progresso, garantindo transparência e qualidade no desenvolvimento.",

    "DOS TESTES E HOMOLOGAÇÃO: Todos os sistemas desenvolvidos passarão por testes unitários, de integração e de aceitação. O CONTRATANTE terá prazo de 7 (sete) dias úteis para homologação de cada entrega, sendo o silêncio considerado como aprovação tácita.",

    "DA DOCUMENTAÇÃO TÉCNICA: O CONTRATADO fornecerá documentação técnica completa incluindo manual do usuário, manual técnico, diagramas de arquitetura, dicionário de dados e instruções de instalação e configuração dos sistemas desenvolvidos.",

    "DA INADIMPLÊNCIA: Em caso de inadimplência por período superior a 5 dias após o vencimento, o CONTRATADO poderá, mediante aviso prévio de 48 horas, suspender parcial ou totalmente os serviços prestados, incluindo suporte técnico, manutenção, integrações e demais funcionalidades sob sua responsabilidade. Caso o CONTRATADO seja responsável pela hospedagem, infraestrutura ou gerenciamento técnico do sistema, poderá ainda suspender o acesso ao sistema até a regularização dos pagamentos pendentes. O restabelecimento dos serviços ocorrerá após a confirmação do pagamento, podendo levar até 48 horas. O CONTRATANTE declara estar ciente de que a suspensão poderá impactar o funcionamento do sistema, não cabendo ao CONTRATADO qualquer responsabilidade por prejuízos decorrentes da inadimplência.",
  ])

  // Canvas refs e states para assinatura
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 })

  // Estados da carteira
  const [moedaSelecionada, setMoedaSelecionada] = useState<"BRL" | "USD">("BRL")
  const [cotacaoUSD, setCotacaoUSD] = useState<number>(5.5)
  const [movimentacoes, setMovimentacoes] = useState<any[]>([])
  const [novaMovimentacao, setNovaMovimentacao] = useState({
    tipo: "entrada" as "entrada" | "saida",
    titulo: "",
    observacao: "",
    data: "",
    valor: 0,
    formaPagamento: "",
    motivo: "",
    moeda: "BRL" as "BRL" | "USD",
  })
  const [filtroMovimentacoes, setFiltroMovimentacoes] = useState("")

  // Adicionar após os estados existentes da carteira
  const [contas, setContas] = useState<string[]>(["Principal"])
  const [contaSelecionada, setContaSelecionada] = useState<string>("Principal")
  const [novaConta, setNovaConta] = useState<string>("")
  const [moedaOrcamento, setMoedaOrcamento] = useState<"BRL" | "USD">("BRL")
  const [idiomaOrcamento, setIdiomaOrcamento] = useState<"pt" | "en">("pt")

  // Adicionar após os estados existentes dos contratos
  const [moedaContrato, setMoedaContrato] = useState<"BRL" | "USD">("BRL")
  const [idiomaContrato, setIdiomaContrato] = useState<"pt" | "en">("pt")

  // Estados de Clientes
  const [clientes, setClientes] = useState<ClienteCadastro[]>([])
  const [novoCliente, setNovoCliente] = useState<ClienteCadastro>({
    id: "",
    nome: "",
    cpfCnpj: "",
    endereco: "",
    telefone: "",
    email: "",
  })
  const [filtroClientes, setFiltroClientes] = useState<string>("")

  // Estado de Login
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [loginPassword, setLoginPassword] = useState<string>("")

  useEffect(() => {
    const auth = localStorage.getItem("auth_felipe_admin")
    if (auth === "true") {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (loginPassword === "felipeadmin") {
      setIsAuthenticated(true)
      localStorage.setItem("auth_felipe_admin", "true")
      toast({
        title: "Login realizado",
        description: "Bem-vindo ao sistema!",
      })
    } else {
      toast({
        title: "Acesso negado",
        description: "Senha incorreta.",
        variant: "destructive",
      })
    }
  }

  const menuItems = [
    { id: "orcamento", label: "Criar Orçamento", icon: Plus },
    { id: "visualizar", label: "Visualizar Orçamento", icon: Eye, disabled: !orcamentoGerado },
    { id: "contratos", label: "Contratos", icon: FileText },
    { id: "historico-contratos", label: "Histórico de Contratos", icon: History },
    { id: "clientes", label: "Cadastro de Clientes", icon: Users },
    { id: "carteira", label: "Carteira", icon: Wallet },
    { id: "historico", label: "Histórico de Orçamentos", icon: History },
    { id: "os", label: "Ordens de Serviço", icon: Wrench },
    { id: "configuracoes", label: "Configurações", icon: Settings },
  ]

  useEffect(() => {
    // Carregar dados do servidor (Supabase)
    const loadData = async () => {
      try {
        const [
          products,
          clients,
          budgets,
          contracts,
          settings,
          accounts,
          transactions
        ] = await Promise.all([
          fetchProducts().catch(e => { console.error('Error fetching products:', e); return [] }),
          fetchClients().catch(e => { console.error('Error fetching clients:', e); return [] }),
          fetchBudgets().catch(e => { console.error('Error fetching budgets:', e); return [] }),
          fetchContracts().catch(e => { console.error('Error fetching contracts:', e); return [] }),
          fetchSettings().catch(e => { console.error('Error fetching settings:', e); return null }),
          fetchAccounts().catch(e => { console.error('Error fetching accounts:', e); return [] }),
          fetchTransactions().catch(e => { console.error('Error fetching transactions:', e); return [] })
        ])

        if (products && products.length > 0) setItensSalvos(products)
        if (clients && clients.length > 0) setClientes(clients)
        if (budgets && budgets.length > 0) setHistorico(budgets)
        if (contracts && contracts.length > 0) setHistoricoContratos(contracts)
        if (settings) setConfiguracoes(settings)
        if (accounts) {
          const contasNormalizadas = accounts.includes("Principal") ? accounts : ["Principal", ...accounts]
          setContas(contasNormalizadas.length > 0 ? contasNormalizadas : ["Principal"])
          if (!contasNormalizadas.includes(contaSelecionada)) {
            setContaSelecionada(contasNormalizadas[0] || "Principal")
          }
        }
        if (transactions && transactions.length > 0) setMovimentacoes(transactions)

        try {
          await saveAccount("Principal")
        } catch (error) {
          console.error("Erro ao garantir conta Principal:", error)
        }

        // Adicionar um item vazio se não houver nenhum
        if (itens.length === 0) {
          adicionarItem()
        }

      } catch (error) {
        console.error("Erro geral ao carregar dados:", error)
        toast({
          title: "Erro de conexão",
          description: "Não foi possível carregar os dados do banco de dados.",
          variant: "destructive"
        })
      }
    }

    loadData()
  }, [])

  // Inicializar canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext("2d")
      if (ctx) {
        // Configurar canvas
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.strokeStyle = "#000000"
        ctx.lineWidth = 2

        // Limpar canvas
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }
  }, [])

  // Funções da carteira
  const buscarCotacaoUSD = async () => {
    try {
      const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD")
      const data = await response.json()
      if (data.rates && data.rates.BRL) {
        setCotacaoUSD(data.rates.BRL)
      }
    } catch (error) {
      console.error("Erro ao buscar cotação:", error)
      // Usar cotação padrão em caso de erro
      setCotacaoUSD(5.5)
    }
  }

  // Substituir a função adicionarMovimentacao
  const adicionarMovimentacao = async () => {
    if (!novaMovimentacao.titulo || !novaMovimentacao.data || novaMovimentacao.valor <= 0) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios!",
        variant: "destructive",
      })
      return
    }

    const movimentacao = {
      id: generateUUID(),
      ...novaMovimentacao,
      conta: contaSelecionada,
      dataHora: new Date().toLocaleString("pt-BR"),
    }

    try {
      await saveAccount(contaSelecionada)
      const saved = await saveTransaction(movimentacao)
      setMovimentacoes((prev) => [saved, ...prev])
      
      // Limpar formulário
      setNovaMovimentacao({
        tipo: "entrada",
        titulo: "",
        observacao: "",
        data: "",
        valor: 0,
        formaPagamento: "",
        motivo: "",
        moeda: "BRL",
      })

      toast({
        title: "Movimentação adicionada",
        description: `${movimentacao.tipo === "entrada" ? "Entrada" : "Saída"} registrada na conta ${contaSelecionada}!`,
      })
    } catch (error) {
      console.error("Erro ao salvar movimentação:", error)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a movimentação.",
        variant: "destructive"
      })
    }
  }

  // Adicionar função para criar nova conta
  const adicionarConta = async () => {
    if (!novaConta.trim()) {
      toast({
        title: "Nome inválido",
        description: "Digite um nome para a nova conta!",
        variant: "destructive",
      })
      return
    }

    if (contas.includes(novaConta.trim())) {
      toast({
        title: "Conta já existe",
        description: "Já existe uma conta com este nome!",
        variant: "destructive",
      })
      return
    }

    try {
      await saveAccount(novaConta.trim())
      
      const novasContas = [...contas, novaConta.trim()]
      setContas(novasContas)
      setNovaConta("")

      toast({
        title: "Conta criada",
        description: `Conta "${novaConta.trim()}" criada com sucesso!`,
      })
    } catch (error) {
      console.error("Erro ao criar conta:", error)
      toast({
        title: "Erro ao criar",
        description: "Não foi possível criar a conta.",
        variant: "destructive"
      })
    }
  }

  // Adicionar função para remover conta
  const removerConta = async (nomeConta: string) => {
    if (nomeConta === "Principal") {
      toast({
        title: "Não é possível remover",
        description: "A conta Principal não pode ser removida!",
        variant: "destructive",
      })
      return
    }

    if (contas.length <= 1) {
      toast({
        title: "Não é possível remover",
        description: "É necessário manter pelo menos uma conta!",
        variant: "destructive",
      })
      return
    }

    try {
      await deleteAccount(nomeConta)
      
      // Remover movimentações da conta (atualizar estado local)
      const movimentacoesFiltradas = movimentacoes.filter((mov) => mov.conta !== nomeConta)
      setMovimentacoes(movimentacoesFiltradas)
      
      // Remover conta (atualizar estado local)
      const novasContas = contas.filter((conta) => conta !== nomeConta)
      setContas(novasContas)
      
      // Se a conta removida era a selecionada, selecionar a primeira
      if (contaSelecionada === nomeConta) {
        setContaSelecionada(novasContas[0])
      }

      toast({
        title: "Conta removida",
        description: `Conta "${nomeConta}" e suas movimentações foram removidas!`,
      })
    } catch (error) {
      console.error("Erro ao remover conta:", error)
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover a conta. Verifique se existem movimentações.",
        variant: "destructive"
      })
    }
  }

  // Funções de Clientes
  const adicionarCliente = async () => {
    if (!novoCliente.nome) {
      toast({
        title: "Nome obrigatório",
        description: "O nome do cliente é obrigatório.",
        variant: "destructive",
      })
      return
    }

    try {
      const savedClient = await saveClient(novoCliente)
      
      let novosClientes
      if (novoCliente.id) {
        // Editar
        novosClientes = clientes.map((c) => (c.id === savedClient.id ? savedClient : c))
        toast({
          title: "Cliente atualizado",
          description: "Dados do cliente atualizados com sucesso.",
        })
      } else {
        // Novo
        novosClientes = [savedClient, ...clientes]
        toast({
          title: "Cliente cadastrado",
          description: "Cliente cadastrado com sucesso.",
        })
      }

      setClientes(novosClientes)
      setNovoCliente({
        id: "",
        nome: "",
        cpfCnpj: "",
        endereco: "",
        telefone: "",
        email: "",
      })
    } catch (error) {
      console.error("Erro ao salvar cliente:", error)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o cliente.",
        variant: "destructive"
      })
    }
  }

  const removerCliente = async (id: string) => {
    try {
      await deleteClient(id)
      const novosClientes = clientes.filter((c) => c.id !== id)
      setClientes(novosClientes)
      toast({
        title: "Cliente removido",
        description: "Cliente removido com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao remover cliente:", error)
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o cliente.",
        variant: "destructive"
      })
    }
  }

  const carregarClienteParaEdicao = (cliente: ClienteCadastro) => {
    setNovoCliente(cliente)
  }

  // Modificar a função filtrarMovimentacoes para filtrar por conta
  const filtrarMovimentacoes = () => {
    let movimentacoesFiltradas = movimentacoes
      .filter((mov) => mov.conta === contaSelecionada || !mov.conta) // Compatibilidade com movimentações antigas
      .map((mov) => ({
        ...mov,
        valorExibicao:
          mov.moeda === moedaSelecionada ? mov.valor : converterValor(mov.valor, mov.moeda, moedaSelecionada),
        moedaExibicao: moedaSelecionada,
      }))

    // Filtrar por termo de busca
    if (filtroMovimentacoes) {
      const termo = filtroMovimentacoes.toLowerCase()
      movimentacoesFiltradas = movimentacoesFiltradas.filter(
        (mov) =>
          mov.titulo.toLowerCase().includes(termo) ||
          mov.observacao.toLowerCase().includes(termo) ||
          mov.formaPagamento.toLowerCase().includes(termo) ||
          (mov.motivo && mov.motivo.toLowerCase().includes(termo)),
      )
    }

    return movimentacoesFiltradas
  }

  // Modificar a função calcularSaldo para calcular por conta
  const calcularSaldo = () => {
    const movimentacoesFiltradas = movimentacoes
      .filter((mov) => mov.conta === contaSelecionada || !mov.conta) // Compatibilidade com movimentações antigas
      .map((mov) => ({
        ...mov,
        valorConvertido:
          mov.moeda === moedaSelecionada ? mov.valor : converterValor(mov.valor, mov.moeda, moedaSelecionada),
      }))

    const entradas = movimentacoesFiltradas
      .filter((mov) => mov.tipo === "entrada")
      .reduce((total, mov) => total + mov.valorConvertido, 0)

    const saidas = movimentacoesFiltradas
      .filter((mov) => mov.tipo === "saida")
      .reduce((total, mov) => total + mov.valorConvertido, 0)

    return entradas - saidas
  }

  // Adicionar função para calcular totais de todas as contas
  const calcularTotaisGerais = () => {
    const totaisPorConta = contas.map((conta) => {
      const movimentacoesConta = movimentacoes
        .filter((mov) => mov.conta === conta || (!mov.conta && conta === "Principal"))
        .map((mov) => ({
          ...mov,
          valorConvertido:
            mov.moeda === moedaSelecionada ? mov.valor : converterValor(mov.valor, mov.moeda, moedaSelecionada),
        }))

      const entradas = movimentacoesConta
        .filter((mov) => mov.tipo === "entrada")
        .reduce((total, mov) => total + mov.valorConvertido, 0)

      const saidas = movimentacoesConta
        .filter((mov) => mov.tipo === "saida")
        .reduce((total, mov) => total + mov.valorConvertido, 0)

      return {
        conta,
        saldo: entradas - saidas,
        entradas,
        saidas,
        movimentacoes: movimentacoesConta.length,
      }
    })

    const saldoTotal = totaisPorConta.reduce((total, conta) => total + conta.saldo, 0)
    const entradasTotal = totaisPorConta.reduce((total, conta) => total + conta.entradas, 0)
    const saidasTotal = totaisPorConta.reduce((total, conta) => total + conta.saidas, 0)
    const movimentacoesTotal = totaisPorConta.reduce((total, conta) => total + conta.movimentacoes, 0)

    return {
      saldoTotal,
      entradasTotal,
      saidasTotal,
      movimentacoesTotal,
      contasDetalhes: totaisPorConta,
    }
  }

  const formatarValor = (valor: number, moeda: "BRL" | "USD") => {
    if (moeda === "BRL") {
      return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    } else {
      return valor.toLocaleString("en-US", { style: "currency", currency: "USD" })
    }
  }

  const converterValor = (valor: number, deMoeda: "BRL" | "USD", paraMoeda: "BRL" | "USD") => {
    if (deMoeda === paraMoeda) return valor

    if (deMoeda === "USD" && paraMoeda === "BRL") {
      return valor * cotacaoUSD
    } else if (deMoeda === "BRL" && paraMoeda === "USD") {
      return valor / cotacaoUSD
    }

    return valor
  }

  // Adicionar após as funções da carteira
  const traduzir = (textoPt: string, textoEn: string) => {
    return idiomaOrcamento === "pt" ? textoPt : textoEn
  }

  // Adicionar função para tradução de contratos
  const traduzirContrato = (textoPt: string, textoEn: string) => {
    return idiomaContrato === "pt" ? textoPt : textoEn
  }

  const formatarMoedaOrcamento = (valor: number) => {
    if (moedaOrcamento === "BRL") {
      return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    } else {
      // Converter de BRL para USD se necessário
      const valorUSD = valor / cotacaoUSD
      return valorUSD.toLocaleString("en-US", { style: "currency", currency: "USD" })
    }
  }

  // Adicionar função para formatação de moeda em contratos
  const formatarMoedaContrato = (valor: number) => {
    if (moedaContrato === "BRL") {
      return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    } else {
      // Converter de BRL para USD se necessário
      const valorUSD = valor / cotacaoUSD
      return valorUSD.toLocaleString("en-US", { style: "currency", currency: "USD" })
    }
  }

  // Função para preencher dados do contratado automaticamente
  const preencherDadosContratado = () => {
    if (configuracoes.dadosContratado.nome) {
      setContratoAtual({
        ...contratoAtual,
        contratado: { ...configuracoes.dadosContratado },
      })
      toast({
        title: "Dados preenchidos",
        description: "Os dados do contratado foram preenchidos automaticamente.",
      })
    } else {
      toast({
        title: "Dados não configurados",
        description: "Configure os dados do contratado nas configurações primeiro.",
        variant: "destructive",
      })
    }
  }

  // Funções do canvas de assinatura
  const getCanvasPosition = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      }
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    setIsDrawing(true)
    const pos = getCanvasPosition(e)
    setLastPosition(pos)

    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const pos = getCanvasPosition(e)

    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()

    setLastPosition(pos)
  }

  const stopDrawing = (e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (e) e.preventDefault()
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    setConfiguracoes({ ...configuracoes, assinaturaContratado: "" })

    toast({
      title: "Canvas limpo",
      description: "A assinatura foi removida.",
    })
  }

  const saveSignature = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Verificar se há algo desenhado no canvas
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    let hasDrawing = false

    // Verificar se há pixels não brancos
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) {
        hasDrawing = true
        break
      }
    }

    if (!hasDrawing) {
      toast({
        title: "Nenhuma assinatura",
        description: "Desenhe sua assinatura antes de salvar.",
        variant: "destructive",
      })
      return
    }

    try {
      toast({
        title: "Salvando assinatura...",
        description: "Aguarde enquanto a imagem é enviada.",
      })

      const dataURL = canvas.toDataURL("image/png")
      const res = await fetch(dataURL)
      const blob = await res.blob()
      const file = new File([blob], `signature_contractor.png`, { type: "image/png" })

      const signatureUrl = await uploadImage(file, 'images')
      
      const novasConfiguracoes = { ...configuracoes, assinaturaContratado: signatureUrl }
      setConfiguracoes(novasConfiguracoes)
      
      await saveSettings(novasConfiguracoes)

      toast({
        title: "Assinatura salva",
        description: "Sua assinatura foi salva com sucesso no banco de dados.",
      })
    } catch (error) {
      console.error("Erro ao salvar assinatura:", error)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a assinatura.",
        variant: "destructive",
      })
    }
  }

  const adicionarItem = () => {
    setItens([...itens, { id: generateUUID(), descricao: "", valor: 0 }])
  }

  const adicionarItemSalvo = () => {
    if (!itemSelecionado) return

    const item = itensSalvos.find((item) => item.id === itemSelecionado)
    if (item) {
      setItens([...itens, { ...item, id: generateUUID() }])
      setItemSelecionado("")
    }
  }

  const removerItem = (id: string) => {
    // Verificar se não é o último item antes de remover
    if (itens.length > 1) {
      setItens(itens.filter((item) => item.id !== id))
    } else {
      // Se for o último item, limpar seus valores em vez de remover
      setItens([{ id: generateUUID(), descricao: "", valor: 0 }])
      toast({
        title: "Aviso",
        description: "É necessário manter pelo menos um item no orçamento.",
      })
    }
  }

  const atualizarItem = (id: string, campo: keyof Item, valor: string | number) => {
    setItens(itens.map((item) => (item.id === id ? { ...item, [campo]: valor } : item)))
  }

  const salvarItem = async (item: Item) => {
    if (!item.descricao || item.valor <= 0) {
      toast({
        title: "Erro ao salvar item",
        description: "Preencha a descrição e valor antes de salvar!",
        variant: "destructive",
      })
      return
    }

    try {
        // Check if item exists in saved items to update it instead of creating duplicate
        const itemExistente = itensSalvos.find(i => i.descricao === item.descricao)
        
        let itemToSave = { ...item }
        if (itemExistente) {
            itemToSave.id = itemExistente.id
        } 
        
        // If the item id is a random UUID from frontend (which likely doesn't exist in DB yet unless it's an update),
        // we can let upsert handle it. 
        
        const savedProduct = await saveProduct(itemToSave)
        
        let novoItensSalvos = [...itensSalvos]
        const index = novoItensSalvos.findIndex(i => i.id === savedProduct.id)
        
        if (index >= 0) {
            novoItensSalvos[index] = savedProduct
             toast({
                title: "Item atualizado",
                description: "O item já existente foi atualizado com o novo valor.",
            })
        } else {
            novoItensSalvos.push(savedProduct)
            toast({
                title: "Item salvo",
                description: "Item adicionado à lista de itens salvos.",
            })
        }

        setItensSalvos(novoItensSalvos)

    } catch (error) {
        console.error("Erro ao salvar item:", error)
        toast({
            title: "Erro ao salvar",
            description: "Não foi possível salvar o item.",
            variant: "destructive"
        })
    }
  }

  const adicionarItemSalvoVazio = () => {
    setItensSalvos([...itensSalvos, { id: generateUUID(), descricao: "", valor: 0 }])
  }

  const atualizarItemSalvo = (id: string, campo: keyof Item, valor: string | number) => {
    setItensSalvos(itensSalvos.map((item) => (item.id === id ? { ...item, [campo]: valor } : item)))
  }

  const salvarItemSalvo = async (item: Item) => {
    if (!item.descricao || item.valor <= 0) {
      toast({
        title: "Erro ao salvar item",
        description: "Preencha a descrição e valor antes de salvar!",
        variant: "destructive",
      })
      return
    }

    try {
      const savedProduct = await saveProduct(item)
      
      let novoItensSalvos = [...itensSalvos]
      const index = novoItensSalvos.findIndex(i => i.id === savedProduct.id)
      
      if (index >= 0) {
        novoItensSalvos[index] = savedProduct
        toast({
          title: "Item atualizado",
          description: "O item foi atualizado com sucesso.",
        })
      } else {
        novoItensSalvos.push(savedProduct)
        toast({
          title: "Item salvo",
          description: "Item adicionado à lista de itens salvos.",
        })
      }
      
      setItensSalvos(novoItensSalvos)
    } catch (error) {
      console.error("Erro ao salvar item:", error)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o item.",
        variant: "destructive"
      })
    }
  }

  const removerItemSalvo = async (id: string) => {
    try {
      await deleteProduct(id)
      const novoItensSalvos = itensSalvos.filter((item) => item.id !== id)
      setItensSalvos(novoItensSalvos)

      toast({
        title: "Item removido",
        description: "Item removido da lista de itens salvos.",
      })
    } catch (error) {
      console.error("Erro ao remover item:", error)
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o item. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const calcularTotal = () => {
    return itens.reduce((total, item) => total + item.valor, 0)
  }

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  }

  const formatarTelefone = (telefone: string) => {
    const numero = telefone.replace(/\D/g, "")
    if (numero.length === 11) {
      return `(${numero.slice(0, 2)}) ${numero.slice(2, 7)}-${numero.slice(7)}`
    }
    return telefone
  }

  const gerarOrcamento = async () => {
    if (!cliente.nome || !cliente.telefone) {
      toast({
        title: traduzir("Dados incompletos", "Incomplete data"),
        description: traduzir("Por favor, preencha os dados do cliente!", "Please fill in the client information!"),
        variant: "destructive",
      })
      return
    }

    const itensValidos = itens.filter((item) => item.descricao && item.valor > 0)

    if (itensValidos.length === 0) {
      toast({
        title: traduzir("Itens incompletos", "Incomplete items"),
        description: traduzir("Adicione pelo menos um item ao orçamento!", "Add at least one item to the budget!"),
        variant: "destructive",
      })
      return
    }

    // Gerar número de orçamento
    const novoNumeroOrcamento = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, "0")
    setNumeroOrcamento(novoNumeroOrcamento)

    // Definir data e hora
    const dataAtual = new Date()
    const dataFormatada = dataAtual.toLocaleDateString(idiomaOrcamento === "pt" ? "pt-BR" : "en-US")
    const horaFormatada = dataAtual.toLocaleTimeString(idiomaOrcamento === "pt" ? "pt-BR" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })

    setDataOrcamento(dataFormatada)
    setHoraOrcamento(horaFormatada)

    // Criar objeto de orçamento para o histórico
    const novoOrcamento: Orcamento = {
      id: generateUUID(),
      numero: novoNumeroOrcamento,
      cliente: { ...cliente },
      itens: itensValidos.map((item) => ({ ...item })),
      total: calcularTotal(),
      data: dataFormatada,
      hora: horaFormatada,
      moeda: moedaOrcamento,
      idioma: idiomaOrcamento,
    }

    try {
      await saveBudget(novoOrcamento)
      
      // Adicionar ao histórico
      const novoHistorico = [novoOrcamento, ...historico]
      setHistorico(novoHistorico)
      
      setOrcamentoGerado(true)
      setActiveTab("visualizar")

      toast({
        title: traduzir("Orçamento gerado", "Budget generated"),
        description: traduzir(
          `Orçamento Nº ${novoNumeroOrcamento} gerado com sucesso!`,
          `Budget No. ${novoNumeroOrcamento} generated successfully!`,
        ),
      })
    } catch (error) {
      console.error("Erro ao salvar orçamento:", error)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o orçamento.",
        variant: "destructive"
      })
    }
  }

  const gerarPDF = async (elementoId = "orcamento-pdf") => {
    const elemento = document.getElementById(elementoId)
    if (!elemento) return

    toast({
      title: "Gerando PDF",
      description: "Aguarde enquanto o PDF é gerado...",
    })

    try {
      const canvas = await html2canvas(elemento, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      })

      const imgData = canvas.toDataURL("image/jpeg", 1.0)

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      const imgX = (pdfWidth - imgWidth * ratio) / 2
      const imgY = 10

      pdf.addImage(imgData, "JPEG", imgX, imgY, imgWidth * ratio, imgHeight * ratio)

      const numOrcamento =
        elementoId === "orcamento-pdf" ? numeroOrcamento : orcamentoSelecionado?.numero || "orcamento"
      pdf.save(`orcamento_${numOrcamento}.pdf`)

      toast({
        title: "PDF gerado com sucesso",
        description: "O arquivo foi baixado para o seu dispositivo.",
      })
    } catch (error) {
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao gerar o PDF. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const limparFormulario = () => {
    setCliente({ nome: "", telefone: "" })
    setItens([{ id: generateUUID(), descricao: "", valor: 0 }])
    setOrcamentoGerado(false)
    setActiveTab("orcamento")
  }

  const salvarConfiguracoes = async (novasConfiguracoes: typeof configuracoes) => {
    try {
      await saveSettings(novasConfiguracoes)
      setConfiguracoes(novasConfiguracoes)
      toast({
        title: "Configurações salvas",
        description: "As configurações foram atualizadas com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao salvar configurações:", error)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive"
      })
    }
  }

  const removerOrcamentoHistorico = async (id: string) => {
    try {
      await deleteBudget(id)
      const novoHistorico = historico.filter((orc) => orc.id !== id)
      setHistorico(novoHistorico)
      
      // Fechar o diálogo se o orçamento selecionado for o que está sendo removido
      if (orcamentoSelecionado && orcamentoSelecionado.id === id) {
        setOrcamentoSelecionado(null)
      }

      toast({
        title: "Orçamento removido",
        description: "O orçamento foi removido do histórico.",
      })
    } catch (error) {
      console.error("Erro ao remover orçamento:", error)
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o orçamento. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const limparHistorico = async () => {
    try {
      // Remover um por um
      await Promise.all(historico.map(orc => deleteBudget(orc.id)))

      setHistorico([])
      setFiltroHistorico("")
      toast({
        title: "Histórico limpo",
        description: "Todos os orçamentos foram removidos do histórico.",
      })
    } catch (error) {
      console.error("Erro ao limpar histórico:", error)
      toast({
        title: "Erro ao limpar histórico",
        description: "Não foi possível limpar o histórico. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const carregarOrcamento = (orcamento: Orcamento) => {
    setCliente(orcamento.cliente)
    setItens(orcamento.itens)
    setNumeroOrcamento(orcamento.numero)
    setDataOrcamento(orcamento.data)
    setHoraOrcamento(orcamento.hora)
    setOrcamentoGerado(true)
    setActiveTab("visualizar")
  }

  const filtrarHistorico = () => {
    if (!filtroHistorico) return historico

    const termoBusca = filtroHistorico.toLowerCase()
    return historico.filter(
      (orc) =>
        orc.numero.includes(termoBusca) ||
        orc.cliente.nome.toLowerCase().includes(termoBusca) ||
        formatarMoeda(orc.total).toLowerCase().includes(termoBusca),
    )
  }

  const gerarContrato = async () => {
    if (!contratoAtual.contratante.nome || !contratoAtual.contratado.nome || !contratoAtual.objeto) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, preencha todos os campos obrigatórios!",
        variant: "destructive",
      })
      return
    }

    const novoNumeroContrato = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, "0")
    const dataAtual = new Date()
    const dataFormatada = dataAtual.toLocaleDateString("pt-BR")
    const horaFormatada = dataAtual.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

    const novoContrato: Contrato = {
      ...contratoAtual,
      id: generateUUID(),
      numero: novoNumeroContrato,
      data: dataFormatada,
      hora: horaFormatada,
    }

    try {
      await saveContract(novoContrato)

      const novoHistoricoContratos = [novoContrato, ...historicoContratos]
      setHistoricoContratos(novoHistoricoContratos)
      
      setContratoAtual({ ...novoContrato })
      setContratoGerado(true)

      toast({
        title: "Contrato gerado",
        description: `Contrato Nº ${novoNumeroContrato} gerado com sucesso!`,
      })
    } catch (error) {
      console.error("Erro ao salvar contrato:", error)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o contrato.",
        variant: "destructive"
      })
    }
  }

  const adicionarClausula = () => {
    if (!novaClausula.trim()) return

    setContratoAtual({
      ...contratoAtual,
      clausulas: [...contratoAtual.clausulas, novaClausula.trim()],
    })
    setNovaClausula("")
  }

  const removerClausula = (index: number) => {
    setContratoAtual({
      ...contratoAtual,
      clausulas: contratoAtual.clausulas.filter((_, i) => i !== index),
    })
  }

  const copyContractLink = (id: string) => {
    const link = `${window.location.origin}/contrato/${id}`
    navigator.clipboard.writeText(link)
    toast({
      title: "Link copiado!",
      description: "Link para assinatura copiado para a área de transferência.",
    })
  }

  const limparContrato = () => {
    setContratoAtual({
      id: "",
      numero: "",
      titulo: "",
      contratante: { nome: "", cpfCnpj: "", endereco: "", telefone: "", email: "" },
      contratado: { nome: "", cpfCnpj: "", endereco: "", telefone: "", email: "" },
      objeto: "",
      valor: 0,
      prazoExecucao: "",
      formaPagamento: "",
      clausulas: [],
      data: "",
      hora: "",
    })
    setContratoGerado(false)
    setNovaClausula("")
  }

  const filtrarContratos = () => {
    if (!filtroContratos) return historicoContratos

    const termoBusca = filtroContratos.toLowerCase()
    return historicoContratos.filter(
      (contrato) =>
        contrato.numero.includes(termoBusca) ||
        contrato.contratante.nome.toLowerCase().includes(termoBusca) ||
        contrato.contratado.nome.toLowerCase().includes(termoBusca) ||
        formatarMoeda(contrato.valor).toLowerCase().includes(termoBusca),
    )
  }

  const filtrarHistoricoContratos = () => {
    if (!filtroHistoricoContratos) return historicoContratos

    const termoBusca = filtroHistoricoContratos.toLowerCase()
    return historicoContratos.filter(
      (contrato) =>
        contrato.numero.includes(termoBusca) ||
        contrato.contratante.nome.toLowerCase().includes(termoBusca) ||
        contrato.contratado.nome.toLowerCase().includes(termoBusca) ||
        formatarMoeda(contrato.valor).toLowerCase().includes(termoBusca),
    )
  }

  const removerContratoHistorico = async (id: string) => {
    try {
      await deleteContract(id)
      const novoHistoricoContratos = historicoContratos.filter((contrato) => contrato.id !== id)
      setHistoricoContratos(novoHistoricoContratos)
      
      if (contratoSelecionado && contratoSelecionado.id === id) {
        setContratoSelecionado(null)
      }

      toast({
        title: "Contrato removido",
        description: "O contrato foi removido do histórico.",
      })
    } catch (error) {
      console.error("Erro ao remover contrato:", error)
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o contrato. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const getErrorMessage = (error: unknown) => {
    if (typeof error === "string") return error
    if (error && typeof error === "object" && "message" in error && typeof (error as any).message === "string") {
      return (error as any).message
    }
    try {
      return JSON.stringify(error)
    } catch {
      return "Erro desconhecido"
    }
  }

  const marcarContratoPago = async (contrato: Contrato) => {
    try {
      const titulo = contrato.titulo && contrato.titulo.trim().length > 0 ? contrato.titulo : `Contrato Nº ${contrato.numero}`
      const chavePagamento = `ID:${contrato.id}`
      const jaRegistradoNaCarteira = movimentacoes.some(
        (mov) =>
          mov.formaPagamento === "contrato" &&
          typeof mov.observacao === "string" &&
          mov.observacao.includes(chavePagamento),
      )

      if (contrato.paidAt && jaRegistradoNaCarteira) {
        toast({
          title: "Pagamento já registrado",
          description: "Este contrato já está pago e já está registrado na carteira.",
        })
        return
      }

      let carimboAtualizado = false
      const paidAt = contrato.paidAt || new Date().toISOString()

      if (!contrato.paidAt) {
        try {
          await markContractPaid(contrato.id)
          carimboAtualizado = true
          setHistoricoContratos((prev) => prev.map((c) => (c.id === contrato.id ? { ...c, paidAt } : c)))
          setContratoAtual((prev) => (prev.id === contrato.id ? { ...prev, paidAt } : prev))
          setContratoSelecionado((prev) => (prev && prev.id === contrato.id ? { ...prev, paidAt } : prev))
        } catch (error) {
          console.error("Erro ao marcar contrato como pago:", error)
        }
      } else {
        carimboAtualizado = true
      }

      const movimentacao = {
        id: generateUUID(),
        tipo: "entrada" as "entrada" | "saida",
        titulo: `Pagamento - ${titulo}`,
        observacao: `Pagamento do contrato ${contrato.numero} - ${contrato.contratante.nome} (${chavePagamento})`,
        data: new Date().toISOString(),
        valor: contrato.valor > 0 ? contrato.valor : 0,
        formaPagamento: "contrato",
        motivo: "contrato",
        moeda: (contrato.moeda as "BRL" | "USD") || "BRL",
        conta: "Principal",
      }

      try {
        await saveAccount("Principal")
        const saved = await saveTransaction(movimentacao)
        setMovimentacoes((prev) => [saved, ...prev])
        toast({
          title: "Pagamento registrado",
          description: `Entrada adicionada na carteira Principal: ${titulo} - ${formatarMoeda(movimentacao.valor)}${carimboAtualizado ? "" : " (carimbo de pago não pôde ser atualizado)"}`,
        })
      } catch (error) {
        console.error("Erro ao registrar pagamento na carteira:", error)
        toast({
          title: carimboAtualizado ? "Contrato marcado como pago" : "Erro",
          description: carimboAtualizado
            ? `Contrato marcado como pago, mas não foi possível registrar na carteira: ${getErrorMessage(error)}`
            : `Não foi possível marcar como pago: ${getErrorMessage(error)}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao marcar como pago:", error)
      toast({
        title: "Erro",
        description: `Não foi possível marcar como pago: ${getErrorMessage(error)}`,
        variant: "destructive",
      })
    }
  }

  const gerarPDFContrato = async (elementoId = "contrato-pdf") => {
    const elemento = document.getElementById(elementoId)
    if (!elemento) return

    toast({
      title: "Gerando PDF",
      description: "Aguarde enquanto o PDF do contrato é gerado...",
    })

    try {
      // Criar um clone do elemento para aplicar estilos de impressão
      const clone = elemento.cloneNode(true) as HTMLElement
      clone.id = "contrato-pdf-temp"

      // Aplicar estilos de impressão ao clone
      clone.style.fontFamily = "Times New Roman, serif"
      clone.style.fontSize = "12px"
      clone.style.lineHeight = "1.4"
      clone.style.color = "#000000"
      clone.style.backgroundColor = "#ffffff"
      clone.style.width = "210mm" // A4 width
      clone.style.padding = "20mm"
      clone.style.boxSizing = "border-box"

      // Ajustar títulos
      const h1Elements = clone.querySelectorAll("h1")
      h1Elements.forEach((h1) => {
        h1.style.fontSize = "18px"
        h1.style.marginBottom = "8px"
      })

      const h2Elements = clone.querySelectorAll("h2")
      h2Elements.forEach((h2) => {
        h2.style.fontSize = "16px"
        h2.style.marginBottom = "6px"
      })

      const h3Elements = clone.querySelectorAll("h3")
      h3Elements.forEach((h3) => {
        h3.style.fontSize = "14px"
        h3.style.marginBottom = "4px"
      })

      // Ajustar espaçamentos
      const spaceY6Elements = clone.querySelectorAll(".space-y-6 > *")
      spaceY6Elements.forEach((el, index) => {
        if (index > 0) {
          ;(el as HTMLElement).style.marginTop = "1rem"
        }
      })

      const spaceY4Elements = clone.querySelectorAll(".space-y-4 > *")
      spaceY4Elements.forEach((el, index) => {
        if (index > 0) {
          ;(el as HTMLElement).style.marginTop = "0.75rem"
        }
      })

      // Ajustar margens específicas
      const mb8Elements = clone.querySelectorAll(".mb-8")
      mb8Elements.forEach((el) => {
        ;(el as HTMLElement).style.marginBottom = "1rem"
      })

      const mb6Elements = clone.querySelectorAll(".mb-6")
      mb6Elements.forEach((el) => {
        ;(el as HTMLElement).style.marginBottom = "0.75rem"
      })

      const mb4Elements = clone.querySelectorAll(".mb-4")
      mb4Elements.forEach((el) => {
        ;(el as HTMLElement).style.marginBottom = "0.5rem"
      })

      const mt16Elements = clone.querySelectorAll(".mt-16")
      mt16Elements.forEach((el) => {
        ;(el as HTMLElement).style.marginTop = "2rem"
      })

      const pt8Elements = clone.querySelectorAll(".pt-8")
      pt8Elements.forEach((el) => {
        ;(el as HTMLElement).style.paddingTop = "1rem"
      })

      const p6Elements = clone.querySelectorAll(".p-6")
      p6Elements.forEach((el) => {
        ;(el as HTMLElement).style.padding = "0.75rem"
      })

      const p4Elements = clone.querySelectorAll(".p-4")
      p4Elements.forEach((el) => {
        ;(el as HTMLElement).style.padding = "0.5rem"
      })

      // Ajustar grid das assinaturas
      const gridElements = clone.querySelectorAll(".grid-cols-1.md\\:grid-cols-2")
      gridElements.forEach((el) => {
        ;(el as HTMLElement).style.display = "grid"
        ;(el as HTMLElement).style.gridTemplateColumns = "1fr 1fr"
        ;(el as HTMLElement).style.gap = "2rem"
      })

      // Adicionar o clone temporariamente ao DOM
      document.body.appendChild(clone)
      clone.style.position = "absolute"
      clone.style.left = "-9999px"
      clone.style.top = "0"

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123, // A4 height in pixels at 96 DPI
        windowWidth: 794,
        windowHeight: 1123,
      })

      // Remover o clone do DOM
      document.body.removeChild(clone)

      const imgData = canvas.toDataURL("image/jpeg", 1.0)

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      const imgX = (pdfWidth - imgWidth * ratio) / 2
      const imgY = 0

      pdf.addImage(imgData, "JPEG", imgX, imgY, imgWidth * ratio, imgHeight * ratio)

      const numContrato = contratoAtual.numero || "contrato"
      pdf.save(`contrato_${numContrato}.pdf`)

      toast({
        title: "PDF gerado com sucesso",
        description: "O contrato foi baixado para o seu dispositivo.",
      })
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao gerar o PDF. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case "orcamento":
        return (
          <div className="space-y-8">
            {/* Opções de Moeda e Idioma */}
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-2xl">{traduzir("Configurações do Orçamento", "Budget Settings")}</CardTitle>
                  <CardDescription>{traduzir("Personalize o idioma e moeda do seu orçamento", "Customize the language and currency of your budget")}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="grid gap-3">
                    <Label className="text-sm font-medium text-gray-700">{traduzir("Moeda", "Currency")}</Label>
                    <Select value={moedaOrcamento} onValueChange={(value: "BRL" | "USD") => setMoedaOrcamento(value)}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BRL">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">🇧🇷</span>
                            <span>Real (BRL)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="USD">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">🇺🇸</span>
                            <span>Dollar (USD)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-3">
                    <Label className="text-sm font-medium text-gray-700">{traduzir("Idioma", "Language")}</Label>
                    <Select value={idiomaOrcamento} onValueChange={(value: "pt" | "en") => setIdiomaOrcamento(value)}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">🇧🇷</span>
                            <span>Português</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="en">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">🇺🇸</span>
                            <span>English</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {moedaOrcamento === "USD" && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-blue-800">{traduzir("Cotação USD", "USD Exchange Rate")}</p>
                        <p className="text-sm text-blue-600 mt-1">
                          {traduzir(
                            `1 USD = ${formatarValor(cotacaoUSD, "BRL")}`,
                            `1 USD = ${formatarValor(cotacaoUSD, "BRL")}`,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <CardTitle className="text-xl">{traduzir("Dados do Cliente", "Client Information")}</CardTitle>
                      <CardDescription>{traduzir("Selecione ou cadastre um cliente", "Select or register a client")}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid gap-5">
                    <div className="grid gap-3">
                      <Label className="text-sm font-medium text-gray-700">{traduzir("Cliente Cadastrado", "Registered Client")}</Label>
                      <Select
                        onValueChange={(value) => {
                          const clienteSelecionado = clientes.find((c) => c.id === value)
                          if (clienteSelecionado) {
                            setCliente({ nome: clienteSelecionado.nome, telefone: clienteSelecionado.telefone })
                          }
                        }}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder={traduzir("Selecione um cliente...", "Select a client...")} />
                        </SelectTrigger>
                        <SelectContent>
                          {clientes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="h-px bg-gray-200 my-1"></div>

                    <div className="grid gap-3">
                      <Label htmlFor="nome" className="text-sm font-medium text-gray-700">{traduzir("Nome", "Name")}</Label>
                      <Input
                        id="nome"
                        className="h-11"
                        placeholder={traduzir("Nome completo do cliente", "Client full name")}
                        value={cliente.nome}
                        onChange={(e) => setCliente({ ...cliente, nome: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="telefone" className="text-sm font-medium text-gray-700">{traduzir("Telefone", "Phone")}</Label>
                      <Input
                        id="telefone"
                        className="h-11"
                        placeholder={idiomaOrcamento === "pt" ? "(00) 00000-0000" : "+1 (000) 000-0000"}
                        value={cliente.telefone}
                        onChange={(e) => setCliente({ ...cliente, telefone: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <CardTitle className="text-xl">{traduzir("Itens Salvos", "Saved Items")}</CardTitle>
                      <CardDescription>{traduzir("Gerencie seus itens predefinidos", "Manage your predefined items")}</CardDescription>
                    </div>
                  </div>
                  <Button onClick={() => setShowEditItensSalvos(!showEditItensSalvos)} size="sm" variant="secondary" className="h-10 gap-2">
                    {showEditItensSalvos ? (
                      <>
                        <X className="h-4 w-4" />
                        {traduzir("Fechar Edição", "Close Edit")}
                      </>
                    ) : (
                      <>
                        <Settings className="h-4 w-4" />
                        {traduzir("Editar Itens Salvos", "Edit Saved Items")}
                      </>
                    )}
                  </Button>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid gap-5">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex gap-2">
                        <Select value={itemSelecionado} onValueChange={setItemSelecionado} className="flex-1">
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder={traduzir("Selecione um item...", "Select an item...")} />
                          </SelectTrigger>
                          <SelectContent>
                            {itensSalvos.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.descricao} - {formatarMoedaOrcamento(item.valor)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button onClick={adicionarItemSalvo} disabled={!itemSelecionado} className="h-11 gap-2 bg-blue-600 hover:bg-blue-700">
                          {traduzir("Usar", "Use")}
                        </Button>
                      </div>
                    </div>

                    {showEditItensSalvos && (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                          <h4 className="font-medium text-gray-800">{traduzir("Itens Salvos", "Saved Items")}</h4>
                          <Button onClick={adicionarItemSalvoVazio} size="sm" variant="outline" className="h-8 gap-1">
                            <Plus className="h-3 w-3" />
                            {traduzir("Adicionar Item", "Add Item")}
                          </Button>
                        </div>
                        <Table>
                          <TableHeader className="bg-gray-50">
                            <TableRow>
                              <TableHead className="w-[55%]">{traduzir("Descrição", "Description")}</TableHead>
                              <TableHead>{traduzir("Valor", "Value")}</TableHead>
                              <TableHead className="w-[120px] text-right">{traduzir("Ações", "Actions")}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {itensSalvos.length > 0 ? (
                              itensSalvos.map((item) => (
                                <TableRow key={item.id} className="hover:bg-gray-50">
                                  <TableCell className="py-3">
                                    <Input
                                      className="h-9 text-sm"
                                      placeholder={traduzir("Descrição", "Description")}
                                      value={item.descricao}
                                      onChange={(e) => atualizarItemSalvo(item.id, "descricao", e.target.value)}
                                    />
                                  </TableCell>
                                  <TableCell className="py-3">
                                    <Input
                                      type="number"
                                      className="h-9 text-sm"
                                      placeholder="0,00"
                                      value={item.valor || ""}
                                      onChange={(e) => atualizarItemSalvo(item.id, "valor", Number.parseFloat(e.target.value) || 0)}
                                    />
                                  </TableCell>
                                  <TableCell className="py-3 text-right">
                                    <div className="flex justify-end gap-1">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8"
                                              onClick={() => salvarItemSalvo(item)}
                                              disabled={!item.descricao || item.valor <= 0}
                                            >
                                              <Save className="h-4 w-4 text-green-600" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>{traduzir("Salvar", "Save")}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>

                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8"
                                              onClick={() => removerItemSalvo(item.id)}
                                            >
                                              <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>{traduzir("Remover", "Remove")}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                                  <div className="flex flex-col items-center gap-2">
                                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    <p>{traduzir("Nenhum item salvo ainda", "No saved items yet")}</p>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <CardTitle className="text-xl">{traduzir("Itens do Orçamento", "Budget Items")}</CardTitle>
                    <CardDescription>{traduzir("Adicione e edite os itens do seu orçamento", "Add and edit your budget items")}</CardDescription>
                  </div>
                </div>
                <Button onClick={adicionarItem} size="sm" variant="secondary" className="h-10 gap-2">
                  <Plus className="h-4 w-4" /> 
                  {traduzir("Adicionar Item", "Add Item")}
                </Button>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="w-[55%]">{traduzir("Descrição", "Description")}</TableHead>
                        <TableHead>{traduzir("Valor", "Value")} ({moedaOrcamento})</TableHead>
                        <TableHead className="w-[120px] text-right">{traduzir("Ações", "Actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itens.map((item) => (
                        <TableRow key={item.id} className="hover:bg-gray-50">
                          <TableCell className="py-3">
                            <Input
                              className="h-9 text-sm"
                              placeholder={traduzir("Descrição do item", "Item description")}
                              value={item.descricao}
                              onChange={(e) => atualizarItem(item.id, "descricao", e.target.value)}
                            />
                          </TableCell>
                          <TableCell className="py-3">
                            <Input
                              type="number"
                              className="h-9 text-sm"
                              placeholder="0,00"
                              value={item.valor || ""}
                              onChange={(e) => atualizarItem(item.id, "valor", Number.parseFloat(e.target.value) || 0)}
                            />
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => salvarItem(item)}
                                      disabled={!item.descricao || item.valor <= 0}
                                    >
                                      <Save className="h-4 w-4 text-green-600" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{traduzir("Salvar item", "Save item")}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => removerItem(item.id)}
                                      disabled={itens.length === 1}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{traduzir("Remover item", "Remove item")}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-8 flex flex-col items-end gap-6">
                  <div className="w-full md:w-1/3">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-700">{traduzir("Total do Orçamento", "Budget Total")}</span>
                        <span className="text-3xl font-bold text-blue-700">{formatarMoedaOrcamento(calcularTotal())}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 w-full md:w-auto">
                    <Button variant="outline" onClick={limparFormulario} className="h-11 gap-2 flex-1 md:flex-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {traduzir("Limpar Formulário", "Clear Form")}
                    </Button>
                    <Button
                      onClick={gerarOrcamento}
                      disabled={
                        !cliente.nome ||
                        !cliente.telefone ||
                        itens.filter((i) => i.descricao && i.valor > 0).length === 0
                      }
                      className="h-11 gap-2 flex-1 md:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {traduzir("Gerar Orçamento", "Generate Budget")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 p-2 rounded-full">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <CardTitle className="text-amber-700">{traduzir("Diagnóstico do Sistema", "System Diagnostics")}</CardTitle>
                    <CardDescription className="text-amber-600">{traduzir("Use esta ferramenta se estiver enfrentando problemas", "Use this tool if you're having issues")}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    try {
                      toast({ title: "Testando conexão...", description: "Iniciando teste de escrita..." })

                      const testId = generateUUID()
                      console.log("Tentando inserir cliente teste:", testId)

                      const { data: insertData, error: insertError } = await supabase
                        .from("clients")
                        .insert({
                          id: testId,
                          name: "Teste Diagnóstico",
                          phone: "000000000",
                        })
                        .select()
                        .single()

                      if (insertError) {
                        alert(`ERRO AO INSERIR: ${JSON.stringify(insertError)}`)
                        throw insertError
                      }

                      console.log("Inserção sucesso:", insertData)

                      const { data: selectData, error: selectError } = await supabase
                        .from("clients")
                        .select("*")
                        .eq("id", testId)
                        .single()

                      if (selectError) {
                        alert(`ERRO AO LER: ${JSON.stringify(selectError)}`)
                        throw selectError
                      }

                      const { error: deleteError } = await supabase.from("clients").delete().eq("id", testId)

                      if (deleteError) {
                        alert(`ERRO AO DELETAR: ${JSON.stringify(deleteError)}`)
                        throw deleteError
                      }

                      alert("SUCESSO TOTAL! O sistema está gravando, lendo e deletando corretamente do Supabase.")
                      toast({ title: "Sucesso", description: "Teste de conexão concluído com sucesso!" })
                    } catch (error: any) {
                      console.error("Erro no diagnóstico:", error)
                      toast({
                        title: "Falha no Teste",
                        description: error.message || "Verifique o alerta para mais detalhes",
                        variant: "destructive",
                      })
                    }
                  }}
                  className="gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  {traduzir("Testar Conexão", "Test Connection")}
                </Button>
              </CardContent>
            </Card>
          </div>
        )

      case "visualizar":
        return orcamentoGerado ? (
          <div className="space-y-6">
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => gerarPDF()}>
                <FileDown className="mr-2 h-4 w-4" /> {traduzir("Baixar PDF", "Download PDF")}
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" /> {traduzir("Imprimir", "Print")}
              </Button>
              <Button variant="outline" onClick={limparFormulario}>
                <Copy className="mr-2 h-4 w-4" /> {traduzir("Novo Orçamento", "New Budget")}
              </Button>
            </div>

            <div
              id="orcamento-pdf"
              className="bg-white p-8 rounded-lg border shadow-sm print:shadow-none print:border-none"
            >
              <div className="flex justify-between items-center border-b pb-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-blue-700">
                    {traduzir("Orçamento", "Budget")} Nº {numeroOrcamento}
                  </h2>
                  <p className="text-gray-500">
                    {traduzir("Emitido em", "Issued on")} {dataOrcamento} {traduzir("às", "at")} {horaOrcamento}
                  </p>
                </div>
                <img
                  src={configuracoes.logo || "/placeholder.svg"}
                  alt={configuracoes.nomeEmpresa}
                  className="h-16 w-auto"
                />
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-2">{traduzir("Dados do Cliente", "Client Information")}</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p>
                    <strong>{traduzir("Nome:", "Name:")}</strong> {cliente.nome}
                  </p>
                  <p>
                    <strong>{traduzir("Telefone:", "Phone:")}</strong> {formatarTelefone(cliente.telefone)}
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-2">{traduzir("Itens do Orçamento", "Budget Items")}</h3>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[70%]">{traduzir("Descrição", "Description")}</TableHead>
                        <TableHead>{traduzir("Valor", "Value")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itens
                        .filter((item) => item.descricao && item.valor > 0)
                        .map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.descricao}</TableCell>
                            <TableCell>{formatarMoedaOrcamento(item.valor)}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-end mb-8">
                <div className="bg-blue-50 p-4 rounded-md w-full md:w-1/3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{traduzir("Total:", "Total:")}</span>
                    <span className="text-xl font-bold text-blue-700">{formatarMoedaOrcamento(calcularTotal())}</span>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-500 border-t pt-6 mt-12">
                <p className="text-center mb-2">
                  {traduzir(
                    `Este orçamento tem validade de ${configuracoes.diasValidade} dias.`,
                    `This budget is valid for ${configuracoes.diasValidade} days.`,
                  )}
                </p>
                <div className="text-center">
                  <p>{configuracoes.nomeEmpresa}</p>
                  <p>WhatsApp: {configuracoes.whatsapp}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {traduzir("Nenhum orçamento foi gerado ainda.", "No budget has been generated yet.")}
            </p>
          </div>
        )

      case "contratos":
        return (
          <div className="space-y-6">
            {!contratoGerado ? (
              <>
                {/* Opções de Moeda e Idioma para Contratos */}
                <Card>
                  <CardHeader>
                    <CardTitle>{traduzirContrato("Configurações do Contrato", "Contract Settings")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>{traduzirContrato("Moeda", "Currency")}</Label>
                        <Select value={moedaContrato} onValueChange={(value: "BRL" | "USD") => setMoedaContrato(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BRL">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🇧🇷</span>
                                Real (BRL)
                              </div>
                            </SelectItem>
                            <SelectItem value="USD">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🇺🇸</span>
                                Dollar (USD)
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label>{traduzirContrato("Idioma", "Language")}</Label>
                        <Select value={idiomaContrato} onValueChange={(value: "pt" | "en") => setIdiomaContrato(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pt">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🇧🇷</span>
                                Português
                              </div>
                            </SelectItem>
                            <SelectItem value="en">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🇺🇸</span>
                                English
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {moedaContrato === "USD" && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                        <p className="text-sm text-blue-700">
                          {traduzirContrato(
                            `Cotação atual: 1 USD = ${formatarValor(cotacaoUSD, "BRL")}`,
                            `Current rate: 1 USD = ${formatarValor(cotacaoUSD, "BRL")}`,
                          )}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{traduzirContrato("Dados do Contratante", "Contractor Information")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label>Selecionar Contratante Cadastrado</Label>
                        <Select
                          onValueChange={(value) => {
                            const clienteSelecionado = clientes.find((c) => c.id === value)
                            if (clienteSelecionado) {
                              setContratoAtual({
                                ...contratoAtual,
                                contratante: {
                                  nome: clienteSelecionado.nome,
                                  cpfCnpj: clienteSelecionado.cpfCnpj,
                                  endereco: clienteSelecionado.endereco,
                                  telefone: clienteSelecionado.telefone,
                                  email: clienteSelecionado.email,
                                },
                              })
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um cliente..." />
                          </SelectTrigger>
                          <SelectContent>
                            {clientes.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="contratante-nome">
                          {traduzirContrato("Nome/Razão Social *", "Name/Company Name *")}
                        </Label>
                        <Input
                          id="contratante-nome"
                          placeholder={traduzirContrato("Nome do contratante", "Contractor name")}
                          value={contratoAtual.contratante.nome}
                          onChange={(e) =>
                            setContratoAtual({
                              ...contratoAtual,
                              contratante: { ...contratoAtual.contratante, nome: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="contratante-cpfcnpj">{traduzirContrato("CPF/CNPJ *", "Tax ID *")}</Label>
                        <Input
                          id="contratante-cpfcnpj"
                          placeholder={idiomaContrato === "pt" ? "000.000.000-00" : "Tax ID Number"}
                          value={contratoAtual.contratante.cpfCnpj}
                          onChange={(e) =>
                            setContratoAtual({
                              ...contratoAtual,
                              contratante: { ...contratoAtual.contratante, cpfCnpj: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="contratante-endereco">{traduzirContrato("Endereço", "Address")}</Label>
                        <Input
                          id="contratante-endereco"
                          placeholder={traduzirContrato("Endereço completo", "Full address")}
                          value={contratoAtual.contratante.endereco}
                          onChange={(e) =>
                            setContratoAtual({
                              ...contratoAtual,
                              contratante: { ...contratoAtual.contratante, endereco: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="contratante-telefone">{traduzirContrato("Telefone", "Phone")}</Label>
                        <Input
                          id="contratante-telefone"
                          placeholder={idiomaContrato === "pt" ? "(00) 00000-0000" : "+1 (000) 000-0000"}
                          value={contratoAtual.contratante.telefone}
                          onChange={(e) =>
                            setContratoAtual({
                              ...contratoAtual,
                              contratante: { ...contratoAtual.contratante, telefone: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="contratante-email">E-mail</Label>
                        <Input
                          id="contratante-email"
                          type="email"
                          placeholder={idiomaContrato === "pt" ? "email@exemplo.com" : "email@example.com"}
                          value={contratoAtual.contratante.email}
                          onChange={(e) =>
                            setContratoAtual({
                              ...contratoAtual,
                              contratante: { ...contratoAtual.contratante, email: e.target.value },
                            })
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {traduzirContrato("Dados do Contratado", "Service Provider Information")}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={preencherDadosContratado}
                        disabled={!configuracoes.dadosContratado.nome}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {traduzirContrato("Usar Padrão", "Use Default")}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="contratado-nome">
                          {traduzirContrato("Nome/Razão Social *", "Name/Company Name *")}
                        </Label>
                        <Input
                          id="contratado-nome"
                          placeholder={traduzirContrato("Nome do contratado", "Service provider name")}
                          value={contratoAtual.contratado.nome}
                          onChange={(e) =>
                            setContratoAtual({
                              ...contratoAtual,
                              contratado: { ...contratoAtual.contratado, nome: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="contratado-cpfcnpj">{traduzirContrato("CPF/CNPJ *", "Tax ID *")}</Label>
                        <Input
                          id="contratado-cpfcnpj"
                          placeholder={idiomaContrato === "pt" ? "000.000.000-00" : "Tax ID Number"}
                          value={contratoAtual.contratado.cpfCnpj}
                          onChange={(e) =>
                            setContratoAtual({
                              ...contratoAtual,
                              contratado: { ...contratoAtual.contratado, cpfCnpj: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="contratado-endereco">{traduzirContrato("Endereço", "Address")}</Label>
                        <Input
                          id="contratado-endereco"
                          placeholder={traduzirContrato("Endereço completo", "Full address")}
                          value={contratoAtual.contratado.endereco}
                          onChange={(e) =>
                            setContratoAtual({
                              ...contratoAtual,
                              contratado: { ...contratoAtual.contratado, endereco: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="contratado-telefone">{traduzirContrato("Telefone", "Phone")}</Label>
                        <Input
                          id="contratado-telefone"
                          placeholder={idiomaContrato === "pt" ? "(00) 00000-0000" : "+1 (000) 000-0000"}
                          value={contratoAtual.contratado.telefone}
                          onChange={(e) =>
                            setContratoAtual({
                              ...contratoAtual,
                              contratado: { ...contratoAtual.contratado, telefone: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="contratado-email">E-mail</Label>
                        <Input
                          id="contratado-email"
                          type="email"
                          placeholder={idiomaContrato === "pt" ? "email@exemplo.com" : "email@example.com"}
                          value={contratoAtual.contratado.email}
                          onChange={(e) =>
                            setContratoAtual({
                              ...contratoAtual,
                              contratado: { ...contratoAtual.contratado, email: e.target.value },
                            })
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{traduzirContrato("Detalhes do Contrato", "Contract Details")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="titulo">{traduzirContrato("Título do Contrato *", "Contract Title *")}</Label>
                        <Input
                          id="titulo"
                          placeholder={traduzirContrato(
                            "Ex: Desenvolvimento de Sistema Web",
                            "Ex: Web System Development",
                          )}
                          value={contratoAtual.titulo || ""}
                          onChange={(e) => setContratoAtual({ ...contratoAtual, titulo: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="valor">
                          {traduzirContrato("Valor do Contrato", "Contract Value")} ({moedaContrato})
                        </Label>
                        <Input
                          id="valor"
                          type="number"
                          placeholder="0,00"
                          value={contratoAtual.valor || ""}
                          onChange={(e) =>
                            setContratoAtual({ ...contratoAtual, valor: Number.parseFloat(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="objeto">
                          {traduzirContrato("Descrição do Contrato *", "Contract Description *")}
                        </Label>
                        <textarea
                          id="objeto"
                          className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder={traduzirContrato(
                            "Descreva detalhadamente os serviços que serão prestados, incluindo escopo, metodologia e entregáveis...",
                            "Describe in detail the services to be provided, including scope, methodology and deliverables...",
                          )}
                          value={contratoAtual.objeto}
                          onChange={(e) => setContratoAtual({ ...contratoAtual, objeto: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="prazo">{traduzirContrato("Prazo de Execução", "Execution Period")}</Label>
                        <Input
                          id="prazo"
                          placeholder={traduzirContrato("Ex: 30 dias, 6 meses...", "Ex: 30 days, 6 months...")}
                          value={contratoAtual.prazoExecucao}
                          onChange={(e) => setContratoAtual({ ...contratoAtual, prazoExecucao: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="pagamento">{traduzirContrato("Forma de Pagamento", "Payment Method")}</Label>
                        <Select
                          value={contratoAtual.formaPagamento}
                          onValueChange={(value) => setContratoAtual({ ...contratoAtual, formaPagamento: value })}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={traduzirContrato(
                                "Selecione a forma de pagamento...",
                                "Select payment method...",
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="total-antes">
                              {traduzirContrato(
                                "100% do valor total antes do início do serviço",
                                "100% of total value before service starts",
                              )}
                            </SelectItem>
                            <SelectItem value="total-depois">
                              {traduzirContrato(
                                "100% do valor total após a conclusão do serviço",
                                "100% of total value after service completion",
                              )}
                            </SelectItem>
                            <SelectItem value="50-50">
                              {traduzirContrato(
                                "50% antes do início e 50% após a conclusão do serviço",
                                "50% before start and 50% after completion",
                              )}
                            </SelectItem>
                            <SelectItem value="personalizado">
                              {traduzirContrato(
                                "Forma personalizada (especificar nas cláusulas)",
                                "Custom method (specify in clauses)",
                              )}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{traduzirContrato("Cláusulas Pré-Definidas", "Pre-defined Clauses")}</CardTitle>
                    <CardDescription>
                      {traduzirContrato(
                        "Selecione as cláusulas que deseja incluir no contrato",
                        "Select the clauses you want to include in the contract",
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {clausulasPredefinidas.map((clausula, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <input
                            type="checkbox"
                            id={`clausula-${index}`}
                            checked={contratoAtual.clausulas.includes(clausula)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setContratoAtual({
                                  ...contratoAtual,
                                  clausulas: [...contratoAtual.clausulas, clausula],
                                })
                              } else {
                                setContratoAtual({
                                  ...contratoAtual,
                                  clausulas: contratoAtual.clausulas.filter((c) => c !== clausula),
                                })
                              }
                            }}
                            className="mt-1"
                          />
                          <label htmlFor={`clausula-${index}`} className="text-sm leading-relaxed cursor-pointer">
                            {clausula}
                          </label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{traduzirContrato("Cláusulas Contratuais", "Contract Clauses")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder={traduzirContrato("Digite uma cláusula...", "Enter a clause...")}
                          value={novaClausula}
                          onChange={(e) => setNovaClausula(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && adicionarClausula()}
                        />
                        <Button onClick={adicionarClausula} disabled={!novaClausula.trim()}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {contratoAtual.clausulas.length > 0 && (
                        <div className="space-y-2">
                          {contratoAtual.clausulas.map((clausula, index) => (
                            <div key={index} className="flex items-start gap-2 p-3 border rounded-md">
                              <span className="text-sm font-medium text-muted-foreground min-w-[2rem]">
                                {index + 1}.
                              </span>
                              <span className="flex-1 text-sm">{clausula}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removerClausula(index)}
                                className="h-6 w-6"
                              >
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                  <Button variant="outline" onClick={limparContrato}>
                    {traduzirContrato("Limpar", "Clear")}
                  </Button>
                  <Button
                    onClick={gerarContrato}
                    disabled={
                      !contratoAtual.contratante.nome || !contratoAtual.contratado.nome || !contratoAtual.objeto
                    }
                  >
                    {traduzirContrato("Gerar Contrato", "Generate Contract")}
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => copyContractLink(contratoAtual.id)}>
                    <Link className="mr-2 h-4 w-4" /> {traduzirContrato("Link Assinatura", "Sign Link")}
                  </Button>
                  <Button variant="outline" onClick={() => gerarPDFContrato("contrato-pdf")}>
                    <FileDown className="mr-2 h-4 w-4" /> {traduzirContrato("Baixar PDF", "Download PDF")}
                  </Button>
                  <Button variant="outline" onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" /> {traduzirContrato("Imprimir", "Print")}
                  </Button>
                  <Button variant="outline" onClick={limparContrato}>
                    <Copy className="mr-2 h-4 w-4" /> {traduzirContrato("Novo Contrato", "New Contract")}
                  </Button>
                </div>

                <div
                  id="contrato-pdf"
                  className="bg-white rounded-xl border shadow-sm print:shadow-none print:border-none max-w-4xl mx-auto overflow-hidden relative"
                  style={{ fontFamily: "Times New Roman, serif" }}
                >
                  {contratoAtual.paidAt && (
                    <img
                      src="/pago.png"
                      alt="Pago"
                      className="pointer-events-none absolute right-6 top-24 w-40 opacity-80 rotate-12"
                    />
                  )}
                  <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center gap-4">
                      {configuracoes.logo ? (
                        <img
                          src={configuracoes.logo}
                          alt={configuracoes.nomeEmpresa || "Empresa"}
                          className="h-12 w-auto rounded-sm"
                        />
                      ) : (
                        <div className="text-xl font-bold text-slate-800">
                          {configuracoes.nomeEmpresa || "Empresa"}
                        </div>
                      )}
                      <div className="hidden md:block">
                        {configuracoes.slogan && (
                          <div className="text-sm text-slate-500">{configuracoes.slogan}</div>
                        )}
                        {configuracoes.whatsapp && (
                          <div className="text-xs text-slate-400">WhatsApp: {configuracoes.whatsapp}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-md text-sm font-medium">
                        <span>Contrato Nº {contratoAtual.numero}</span>
                        {contratoAtual.status === "signed" && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {contratoAtual.data} • {contratoAtual.hora}
                      </div>
                    </div>
                  </div>

                  <div className="p-8 md:p-12 font-serif text-slate-900">
                    <div className="text-center mb-10">
                      <h1 className="text-2xl md:text-3xl font-extrabold tracking-wide mb-1">
                        CONTRATO DE PRESTAÇÃO DE SERVIÇOS
                      </h1>
                      {contratoAtual.titulo && <p className="text-slate-500">{contratoAtual.titulo}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="rounded-lg border bg-slate-50 p-5">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">CONTRATANTE</h3>
                        <div className="space-y-1.5 text-sm">
                          <p>
                            <span className="font-medium">Nome:</span> {contratoAtual.contratante.nome}
                          </p>
                          <p>
                            <span className="font-medium">CPF/CNPJ:</span> {contratoAtual.contratante.cpfCnpj}
                          </p>
                          {contratoAtual.contratante.endereco && (
                            <p>
                              <span className="font-medium">Endereço:</span> {contratoAtual.contratante.endereco}
                            </p>
                          )}
                          {contratoAtual.contratante.telefone && (
                            <p>
                              <span className="font-medium">Telefone:</span>{" "}
                              {formatarTelefone(contratoAtual.contratante.telefone)}
                            </p>
                          )}
                          {contratoAtual.contratante.email && (
                            <p>
                              <span className="font-medium">E-mail:</span> {contratoAtual.contratante.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="rounded-lg border bg-slate-50 p-5">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">CONTRATADO</h3>
                        <div className="space-y-1.5 text-sm">
                          <p>
                            <span className="font-medium">Nome:</span> {contratoAtual.contratado.nome}
                          </p>
                          <p>
                            <span className="font-medium">CPF/CNPJ:</span> {contratoAtual.contratado.cpfCnpj}
                          </p>
                          {contratoAtual.contratado.endereco && (
                            <p>
                              <span className="font-medium">Endereço:</span> {contratoAtual.contratado.endereco}
                            </p>
                          )}
                          {contratoAtual.contratado.telefone && (
                            <p>
                              <span className="font-medium">Telefone:</span>{" "}
                              {formatarTelefone(contratoAtual.contratado.telefone)}
                            </p>
                          )}
                          {contratoAtual.contratado.email && (
                            <p>
                              <span className="font-medium">E-mail:</span> {contratoAtual.contratado.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 text-justify leading-relaxed text-sm">
                      <div>
                        <h3 className="text-base font-bold text-slate-800 mb-2">CLÁUSULA 1ª - DO OBJETO</h3>
                        <div className="rounded-lg border bg-white p-5">
                          <p>{contratoAtual.objeto}</p>
                        </div>
                      </div>

                      {contratoAtual.valor > 0 && (
                        <div>
                          <h3 className="text-base font-bold text-slate-800 mb-2">CLÁUSULA 2ª - DO VALOR E PAGAMENTO</h3>
                          <div className="rounded-lg border bg-white p-5 space-y-1.5">
                            <p>
                              Valor total:{" "}
                              <span className="font-bold">{formatarMoedaContrato(contratoAtual.valor)}</span>
                            </p>
                            <p>Forma de pagamento: {contratoAtual.formaPagamento}</p>
                          </div>
                        </div>
                      )}

                      {contratoAtual.prazoExecucao && (
                        <div>
                          <h3 className="text-base font-bold text-slate-800 mb-2">CLÁUSULA 3ª - DO PRAZO</h3>
                          <div className="rounded-lg border bg-white p-5">
                            <p>Prazo de execução: {contratoAtual.prazoExecucao}</p>
                          </div>
                        </div>
                      )}

                      {contratoAtual.clausulas.length > 0 && (
                        <div>
                          <h3 className="text-base font-bold text-slate-800 mb-2">CLÁUSULAS ESPECÍFICAS</h3>
                          <div className="rounded-lg border bg-white p-5">
                            <ul className="list-disc pl-5 space-y-2">
                              {contratoAtual.clausulas.map((clausula, index) => (
                                <li key={index}>{clausula}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      <div className="pt-8 mt-8 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="text-center">
                            <div className="h-20 flex items-end justify-center">
                              {configuracoes.assinaturaContratado ? (
                                <img
                                  src={configuracoes.assinaturaContratado}
                                  alt="Assinatura do Contratado"
                                  className="max-h-20 object-contain"
                                />
                              ) : (
                                <div className="text-slate-400 italic mb-2">{contratoAtual.contratado.nome}</div>
                              )}
                            </div>
                            <div className="border-t border-slate-300 pt-2">
                              <p className="font-bold">{contratoAtual.contratado.nome}</p>
                              <p className="text-xs text-slate-500">CONTRATADO</p>
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="h-20 flex items-end justify-center">
                              {contratoAtual.clientSignature ? (
                                <img
                                  src={contratoAtual.clientSignature}
                                  alt="Assinatura do Contratante"
                                  className="max-h-20 object-contain"
                                />
                              ) : (
                                <div className="text-slate-400 italic mb-2">Aguardando assinatura...</div>
                              )}
                            </div>
                            <div className="border-t border-slate-300 pt-2">
                              <p className="font-bold">{contratoAtual.contratante.nome}</p>
                              <p className="text-xs text-slate-500">CONTRATANTE</p>
                              {contratoAtual.clientSignedAt && (
                                <p className="text-[11px] text-slate-400 mt-1">
                                  Assinado em {new Date(contratoAtual.clientSignedAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-10 text-center text-xs text-slate-500 border-t pt-4">
                      <div className="font-medium">{configuracoes.nomeEmpresa}</div>
                      {configuracoes.whatsapp && <div>WhatsApp: {configuracoes.whatsapp}</div>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {historicoContratos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Contratos Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center border rounded-md px-3 py-2">
                      <Search className="h-5 w-5 text-muted-foreground mr-2" />
                      <Input
                        placeholder="Buscar contratos..."
                        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        value={filtroContratos}
                        onChange={(e) => setFiltroContratos(e.target.value)}
                      />
                    </div>

                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nº</TableHead>
                            <TableHead>Contratante</TableHead>
                            <TableHead>Contratado</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filtrarContratos().map((contrato) => (
                            <TableRow key={contrato.id}>
                              <TableCell className="font-medium">{contrato.numero}</TableCell>
                              <TableCell>{contrato.contratante.nome}</TableCell>
                              <TableCell>{contrato.contratado.nome}</TableCell>
                              <TableCell>{contrato.data}</TableCell>
                              <TableCell>{contrato.valor > 0 ? formatarMoeda(contrato.valor) : "-"}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  {contrato.clientSignature && (
                                    <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium mr-1">
                                      Assinado
                                    </span>
                                  )}
                                  {!contrato.clientSignature && (
                                    <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium mr-1">
                                      Aguardando Assinatura
                                    </span>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => copyContractLink(contrato.id)}
                                    title="Copiar Link de Assinatura"
                                  >
                                    <Link className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setContratoAtual(contrato)
                                      setContratoGerado(true)
                                    }}
                                  >
                                    <Eye className="h-4 w-4 text-blue-500" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removerContratoHistorico(contrato.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )

      case "historico-contratos":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Contratos</CardTitle>
              <CardDescription>Visualize e gerencie todos os contratos já gerados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center border rounded-md px-3 py-2">
                  <Search className="h-5 w-5 text-muted-foreground mr-2" />
                  <Input
                    placeholder="Buscar por número, contratante, contratado ou valor..."
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={filtroHistoricoContratos}
                    onChange={(e) => setFiltroHistoricoContratos(e.target.value)}
                  />
                </div>

                {filtrarHistoricoContratos().length > 0 ? (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nº</TableHead>
                          <TableHead>Contratante</TableHead>
                          <TableHead>Contratado</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtrarHistoricoContratos().map((contrato) => (
                          <TableRow key={contrato.id}>
                            <TableCell className="font-medium">{contrato.numero}</TableCell>
                            <TableCell>{contrato.contratante.nome}</TableCell>
                            <TableCell>{contrato.contratado.nome}</TableCell>
                            <TableCell>{contrato.data}</TableCell>
                            <TableCell>
                              {contrato.valor > 0 ? formatarMoeda(contrato.valor) : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                {contrato.paidAt && (
                                  <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-medium mr-1">
                                    Pago
                                  </span>
                                )}
                                {contrato.clientSignature && (
                                  <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium mr-1">
                                    Assinado
                                  </span>
                                )}
                                {!contrato.clientSignature && (
                                  <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium mr-1">
                                    Aguardando Assinatura
                                  </span>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => copyContractLink(contrato.id)}
                                  title="Copiar Link de Assinatura"
                                >
                                  <Link className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => marcarContratoPago(contrato)}
                                  disabled={!!contrato.paidAt}
                                  title={
                                    contrato.paidAt
                                      ? "Pago"
                                      : "Marcar como pago (adicionar na carteira Principal)"
                                  }
                                >
                                  <DollarSign
                                    className={`h-4 w-4 ${
                                      contrato.paidAt ? "text-slate-400" : "text-emerald-600"
                                    }`}
                                  />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setContratoAtual(contrato)
                                    setContratoGerado(true)
                                    setActiveTab("contratos")
                                  }}
                                  title="Visualizar contrato"
                                >
                                  <Eye className="h-4 w-4 text-blue-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removerContratoHistorico(contrato.id)}
                                  title="Excluir contrato"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-md bg-muted/20">
                    <div className="flex flex-col items-center gap-2">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-medium text-lg">Nenhum contrato encontrado</h3>
                      <p className="text-muted-foreground max-w-md">
                        {historicoContratos.length === 0
                          ? "Você ainda não gerou nenhum contrato. Gere seu primeiro contrato na aba 'Contratos'."
                          : "Nenhum contrato corresponde aos critérios de busca. Tente outros termos."}
                      </p>
                      {historicoContratos.length > 0 && filtroHistoricoContratos && (
                        <Button
                          variant="outline"
                          onClick={() => setFiltroHistoricoContratos("")}
                          className="mt-2"
                        >
                          Limpar Filtro
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {historicoContratos.length > 0 && (
                      <>
                        Total:{" "}
                        <span className="font-medium">{filtrarHistoricoContratos().length}</span> contrato(s)
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case "historico":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Orçamentos</CardTitle>
              <CardDescription>Visualize e gerencie os orçamentos já criados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center border rounded-md px-3 py-2">
                  <Search className="h-5 w-5 text-muted-foreground mr-2" />
                  <Input
                    placeholder="Buscar por número, cliente ou valor..."
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={filtroHistorico}
                    onChange={(e) => setFiltroHistorico(e.target.value)}
                  />
                </div>

                {filtrarHistorico().length > 0 ? (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nº</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtrarHistorico().map((orcamento) => (
                          <TableRow key={orcamento.id}>
                            <TableCell className="font-medium">{orcamento.numero}</TableCell>
                            <TableCell>{orcamento.cliente.nome}</TableCell>
                            <TableCell>{orcamento.data}</TableCell>
                            <TableCell>{formatarMoeda(orcamento.total)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setOrcamentoSelecionado(orcamento)}
                                    >
                                      <Eye className="h-4 w-4 text-blue-500" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-3xl">
                                    <DialogHeader>
                                      <DialogTitle>Orçamento Nº {orcamento.numero}</DialogTitle>
                                      <DialogDescription>
                                        Emitido em {orcamento.data} às {orcamento.hora}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div id={`orcamento-${orcamento.id}`} className="mt-4">
                                      <div className="flex justify-between items-center border-b pb-4 mb-6">
                                        <div>
                                          <h2 className="text-2xl font-bold text-blue-700">
                                            Orçamento Nº {orcamento.numero}
                                          </h2>
                                          <p className="text-gray-500">
                                            Emitido em {orcamento.data} às {orcamento.hora}
                                          </p>
                                        </div>
                                        <img
                                          src={configuracoes.logo || "/placeholder.svg"}
                                          alt={configuracoes.nomeEmpresa}
                                          className="h-16 w-auto"
                                        />
                                      </div>

                                      <div className="mb-8">
                                        <h3 className="text-lg font-semibold mb-2">Dados do Cliente</h3>
                                        <div className="bg-gray-50 p-4 rounded-md">
                                          <p>
                                            <strong>Nome:</strong> {orcamento.cliente.nome}
                                          </p>
                                          <p>
                                            <strong>Telefone:</strong> {formatarTelefone(orcamento.cliente.telefone)}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="mb-8">
                                        <h3 className="text-lg font-semibold mb-2">Itens do Orçamento</h3>
                                        <div className="border rounded-md overflow-hidden">
                                          <Table>
                                            <TableHeader>
                                              <TableRow>
                                                <TableHead className="w-[70%]">Descrição</TableHead>
                                                <TableHead>Valor</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {orcamento.itens.map((item) => (
                                                <TableRow key={item.id}>
                                                  <TableCell>{item.descricao}</TableCell>
                                                  <TableCell>{formatarMoeda(item.valor)}</TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </div>
                                      </div>

                                      <div className="flex justify-end mb-8">
                                        <div className="bg-blue-50 p-4 rounded-md w-full md:w-1/3">
                                          <div className="flex justify-between items-center">
                                            <span className="font-semibold">Total:</span>
                                            <span className="text-xl font-bold text-blue-700">
                                              {formatarMoeda(orcamento.total)}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="text-sm text-gray-500 border-t pt-6 mt-12">
                                        <p className="text-center mb-2">
                                          Este orçamento tem validade de {configuracoes.diasValidade} dias.
                                        </p>
                                        <div className="text-center">
                                          <p>{configuracoes.nomeEmpresa}</p>
                                          <p>WhatsApp: {configuracoes.whatsapp}</p>
                                        </div>
                                      </div>
                                    </div>
                                    <DialogFooter>
                                      <Button variant="outline" onClick={() => gerarPDF(`orcamento-${orcamento.id}`)}>
                                        <FileDown className="mr-2 h-4 w-4" /> Baixar PDF
                                      </Button>
                                      <Button
                                        onClick={() => {
                                          carregarOrcamento(orcamento)
                                          const dialogCloseButton = document.querySelector(
                                            '[data-state="open"] button[data-state="closed"]',
                                          ) as HTMLButtonElement
                                          if (dialogCloseButton) dialogCloseButton.click()
                                        }}
                                      >
                                        <Copy className="mr-2 h-4 w-4" /> Editar Cópia
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        onClick={() => {
                                          removerOrcamentoHistorico(orcamento.id)
                                          const dialogCloseButton = document.querySelector(
                                            '[data-state="open"] button[data-state="closed"]',
                                          ) as HTMLButtonElement
                                          if (dialogCloseButton) dialogCloseButton.click()
                                        }}
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removerOrcamentoHistorico(orcamento.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-md bg-muted/20">
                    <div className="flex flex-col items-center gap-2">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-medium text-lg">Nenhum orçamento encontrado</h3>
                      <p className="text-muted-foreground max-w-md">
                        {historico.length === 0
                          ? "Você ainda não criou nenhum orçamento. Crie seu primeiro orçamento na aba 'Criar Orçamento'."
                          : "Nenhum orçamento corresponde aos critérios de busca. Tente outros termos."}
                      </p>
                      {historico.length > 0 && filtroHistorico && (
                        <Button variant="outline" onClick={() => setFiltroHistorico("")} className="mt-2">
                          Limpar Filtro
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {historico.length > 0 && (
                      <>
                        Total: <span className="font-medium">{filtrarHistorico().length}</span> orçamento(s)
                      </>
                    )}
                  </div>
                  {historico.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 border-red-200 hover:bg-red-50 bg-transparent"
                      onClick={limparHistorico}
                    >
                      Limpar Histórico
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case "clientes":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cadastro de Clientes</CardTitle>
                <CardDescription>Gerencie seus clientes para usar em orçamentos e contratos.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="nomeCliente">Nome / Razão Social *</Label>
                      <Input
                        id="nomeCliente"
                        value={novoCliente.nome}
                        onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })}
                        placeholder="Nome do cliente ou empresa"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="cpfCnpjCliente">CPF / CNPJ</Label>
                      <Input
                        id="cpfCnpjCliente"
                        value={novoCliente.cpfCnpj}
                        onChange={(e) => setNovoCliente({ ...novoCliente, cpfCnpj: e.target.value })}
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="enderecoCliente">Endereço</Label>
                    <Input
                      id="enderecoCliente"
                      value={novoCliente.endereco}
                      onChange={(e) => setNovoCliente({ ...novoCliente, endereco: e.target.value })}
                      placeholder="Rua, Número, Bairro, Cidade - UF"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="telefoneCliente">Telefone</Label>
                      <Input
                        id="telefoneCliente"
                        value={novoCliente.telefone}
                        onChange={(e) => setNovoCliente({ ...novoCliente, telefone: e.target.value })}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="emailCliente">Email</Label>
                      <Input
                        id="emailCliente"
                        type="email"
                        value={novoCliente.email}
                        onChange={(e) => setNovoCliente({ ...novoCliente, email: e.target.value })}
                        placeholder="cliente@email.com"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    {novoCliente.id && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          setNovoCliente({
                            id: "",
                            nome: "",
                            cpfCnpj: "",
                            endereco: "",
                            telefone: "",
                            email: "",
                          })
                        }
                      >
                        Cancelar Edição
                      </Button>
                    )}
                    <Button onClick={adicionarCliente}>
                      {novoCliente.id ? "Atualizar Cliente" : "Cadastrar Cliente"}
                    </Button>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Clientes Cadastrados</h3>
                    <div className="w-full md:w-1/3">
                      <Input
                        placeholder="Buscar cliente..."
                        value={filtroClientes}
                        onChange={(e) => setFiltroClientes(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientes
                          .filter(
                            (c) =>
                              c.nome.toLowerCase().includes(filtroClientes.toLowerCase()) ||
                              c.cpfCnpj.includes(filtroClientes) ||
                              c.email.toLowerCase().includes(filtroClientes.toLowerCase()),
                          )
                          .map((cliente) => (
                            <TableRow key={cliente.id}>
                              <TableCell className="font-medium">{cliente.nome}</TableCell>
                              <TableCell>{cliente.telefone}</TableCell>
                              <TableCell>{cliente.email}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => carregarClienteParaEdicao(cliente)}>
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => removerCliente(cliente.id)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        {clientes.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              Nenhum cliente cadastrado.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "configuracoes":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Gerais</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    salvarConfiguracoes(configuracoes)
                  }}
                >
                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="nomeEmpresa">Nome da Empresa</Label>
                      <Input
                        id="nomeEmpresa"
                        value={configuracoes.nomeEmpresa}
                        onChange={(e) => setConfiguracoes({ ...configuracoes, nomeEmpresa: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="slogan">Slogan/Frase</Label>
                      <Input
                        id="slogan"
                        value={configuracoes.slogan}
                        onChange={(e) => setConfiguracoes({ ...configuracoes, slogan: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        value={configuracoes.whatsapp}
                        onChange={(e) => setConfiguracoes({ ...configuracoes, whatsapp: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="diasValidade">Dias de Validade do Orçamento</Label>
                      <Input
                        id="diasValidade"
                        type="number"
                        min="1"
                        value={configuracoes.diasValidade}
                        onChange={(e) =>
                          setConfiguracoes({ ...configuracoes, diasValidade: Number.parseInt(e.target.value) || 7 })
                        }
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="logo">Logo da Empresa</Label>
                      <div className="grid gap-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Input
                              id="logoFile"
                              type="file"
                              accept="image/*"
                              className="flex-1"
                              onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  try {
                                    toast({
                                      title: "Enviando imagem...",
                                      description: "Aguarde enquanto a imagem é enviada para o servidor.",
                                    })
                                    const publicUrl = await uploadImage(file, 'images')
                                    setConfiguracoes({ ...configuracoes, logo: publicUrl })
                                    toast({
                                      title: "Sucesso",
                                      description: "Logo atualizada com sucesso!",
                                    })
                                  } catch (error) {
                                    console.error("Erro upload:", error)
                                    toast({
                                      title: "Erro no upload",
                                      description: "Falha ao enviar imagem. Verifique se o bucket 'images' existe no Supabase.",
                                      variant: "destructive",
                                    })
                                    // Fallback to base64 if upload fails (optional, keeping old behavior as fallback if needed, but here just showing error)
                                  }
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setConfiguracoes({ ...configuracoes, logo: "/LOGON.png" })}
                            >
                              Restaurar Padrão
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Selecione um arquivo de imagem para usar como logo da empresa
                          </p>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Label htmlFor="logoUrl">Ou use uma URL de imagem</Label>
                          <Input
                            id="logoUrl"
                            placeholder="https://exemplo.com/logo.png"
                            value={
                              configuracoes.logo.startsWith("data:") || configuracoes.logo.startsWith("/")
                                ? ""
                                : configuracoes.logo
                            }
                            onChange={(e) => setConfiguracoes({ ...configuracoes, logo: e.target.value })}
                          />
                        </div>

                        <div className="mt-2 p-4 border rounded-md flex justify-center bg-gray-50">
                          <div className="flex flex-col items-center gap-2">
                            <p className="text-sm font-medium">Preview da Logo:</p>
                            <img
                              src={configuracoes.logo || "/LOGON.png"}
                              alt="Logo Preview"
                              className="max-h-24 max-w-full object-contain"
                              onError={(e) => {
                                e.currentTarget.src = "/LOGON.png"
                                toast({
                                  title: "Erro na imagem",
                                  description: "Não foi possível carregar a imagem. URL inválida.",
                                  variant: "destructive",
                                })
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button type="submit">Salvar Configurações</Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dados Padrão do Contratado</CardTitle>
                <CardDescription>Configure seus dados para preenchimento automático nos contratos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="config-contratado-nome">Nome/Razão Social</Label>
                    <Input
                      id="config-contratado-nome"
                      placeholder="Seu nome ou razão social"
                      value={configuracoes.dadosContratado.nome}
                      onChange={(e) =>
                        setConfiguracoes({
                          ...configuracoes,
                          dadosContratado: { ...configuracoes.dadosContratado, nome: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="config-contratado-cpfcnpj">CPF/CNPJ</Label>
                    <Input
                      id="config-contratado-cpfcnpj"
                      placeholder="000.000.000-00"
                      value={configuracoes.dadosContratado.cpfCnpj}
                      onChange={(e) =>
                        setConfiguracoes({
                          ...configuracoes,
                          dadosContratado: { ...configuracoes.dadosContratado, cpfCnpj: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="config-contratado-endereco">Endereço</Label>
                    <Input
                      id="config-contratado-endereco"
                      placeholder="Endereço completo"
                      value={configuracoes.dadosContratado.endereco}
                      onChange={(e) =>
                        setConfiguracoes({
                          ...configuracoes,
                          dadosContratado: { ...configuracoes.dadosContratado, endereco: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="config-contratado-telefone">Telefone</Label>
                    <Input
                      id="config-contratado-telefone"
                      placeholder="(00) 00000-0000"
                      value={configuracoes.dadosContratado.telefone}
                      onChange={(e) =>
                        setConfiguracoes({
                          ...configuracoes,
                          dadosContratado: { ...configuracoes.dadosContratado, telefone: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="config-contratado-email">E-mail</Label>
                    <Input
                      id="config-contratado-email"
                      type="email"
                      placeholder="email@exemplo.com"
                      value={configuracoes.dadosContratado.email}
                      onChange={(e) =>
                        setConfiguracoes({
                          ...configuracoes,
                          dadosContratado: { ...configuracoes.dadosContratado, email: e.target.value },
                        })
                      }
                    />
                  </div>
                  <Button type="button" onClick={() => salvarConfiguracoes(configuracoes)} className="mt-4">
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Dados do Contratado
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assinatura Digital</CardTitle>
                <CardDescription>Desenhe sua assinatura para aparecer automaticamente nos contratos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Canvas de Assinatura</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                      <canvas
                        ref={canvasRef}
                        width={600}
                        height={200}
                        className="border border-gray-300 rounded cursor-crosshair bg-white w-full max-w-full"
                        style={{ touchAction: "none" }}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                      <p className="text-sm text-muted-foreground mt-2 text-center">
                        Desenhe sua assinatura no campo acima usando o mouse ou toque
                      </p>
                    </div>

                    <div className="flex gap-2 justify-center">
                      <Button type="button" variant="outline" onClick={clearCanvas}>
                        <X className="mr-2 h-4 w-4" />
                        Limpar
                      </Button>
                      <Button type="button" onClick={saveSignature}>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Assinatura
                      </Button>
                    </div>

                    {configuracoes.assinaturaContratado && (
                      <div className="mt-4 p-4 border rounded-md flex justify-center bg-gray-50">
                        <div className="flex flex-col items-center gap-2">
                          <p className="text-sm font-medium">Assinatura Salva:</p>
                          <img
                            src={configuracoes.assinaturaContratado || "/placeholder.svg"}
                            alt="Assinatura Salva"
                            className="max-h-20 max-w-full object-contain border bg-white p-2 rounded"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "carteira":
        const totaisGerais = calcularTotaisGerais()

        return (
          <div className="space-y-6">
            {/* Header da Carteira com Seleção de Conta */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant={moedaSelecionada === "BRL" ? "default" : "outline"}
                  onClick={() => setMoedaSelecionada("BRL")}
                  className="flex items-center gap-2"
                >
                  <span className="text-lg">🇧🇷</span>
                  Real (BRL)
                </Button>
                <Button
                  variant={moedaSelecionada === "USD" ? "default" : "outline"}
                  onClick={() => setMoedaSelecionada("USD")}
                  className="flex items-center gap-2"
                >
                  <span className="text-lg">🇺🇸</span>
                  Dólar (USD)
                </Button>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Cotação USD/BRL</p>
                <p className="text-lg font-bold text-green-600">{formatarValor(cotacaoUSD, "BRL")}</p>
              </div>
            </div>

            {/* Gerenciamento de Contas */}
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Contas</CardTitle>
                <CardDescription>Crie e gerencie diferentes carteiras por conta</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Adicionar Nova Conta */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nome da nova conta..."
                      value={novaConta}
                      onChange={(e) => setNovaConta(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && adicionarConta()}
                    />
                    <Button onClick={adicionarConta} disabled={!novaConta.trim()}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Conta
                    </Button>
                  </div>

                  {/* Lista de Contas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {contas.map((conta) => {
                      const detalheConta = totaisGerais.contasDetalhes.find((c) => c.conta === conta)
                      const isSelected = conta === contaSelecionada

                      return (
                        <Card
                          key={conta}
                          className={`cursor-pointer transition-all ${
                            isSelected ? "ring-2 ring-blue-500 bg-blue-50" : "hover:shadow-md"
                          }`}
                          onClick={() => setContaSelecionada(conta)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-lg">{conta}</h3>
                              {conta !== "Principal" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removerConta(conta)
                                  }}
                                  className="h-6 w-6 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>

                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Saldo:</span>
                                <span
                                  className={`font-semibold ${
                                    (detalheConta?.saldo ?? 0) >= 0 ? "text-green-600" : "text-red-600"
                                  }`}
                                >
                                  {formatarValor(detalheConta?.saldo || 0, moedaSelecionada)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Movimentações:</span>
                                <span>{detalheConta?.movimentacoes || 0}</span>
                              </div>
                            </div>

                            {isSelected && (
                              <div className="mt-2 text-xs text-blue-600 font-medium">✓ Conta Selecionada</div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cards de Resumo da Conta Selecionada */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Saldo - {contaSelecionada}</p>
                      <p className={`text-2xl font-bold ${calcularSaldo() >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatarValor(calcularSaldo(), moedaSelecionada)}
                      </p>
                    </div>
                    <Wallet className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Entradas</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatarValor(
                          movimentacoes
                            .filter(
                              (mov) =>
                                mov.tipo === "entrada" &&
                                (mov.conta === contaSelecionada || (!mov.conta && contaSelecionada === "Principal")),
                            )
                            .reduce((total, mov) => {
                              const valorConvertido =
                                mov.moeda === moedaSelecionada
                                  ? mov.valor
                                  : converterValor(mov.valor, mov.moeda, moedaSelecionada)
                              return total + valorConvertido
                            }, 0),
                          moedaSelecionada,
                        )}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Saídas</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatarValor(
                          movimentacoes
                            .filter(
                              (mov) =>
                                mov.tipo === "saida" &&
                                (mov.conta === contaSelecionada || (!mov.conta && contaSelecionada === "Principal")),
                            )
                            .reduce((total, mov) => {
                              const valorConvertido =
                                mov.moeda === moedaSelecionada
                                  ? mov.valor
                                  : converterValor(mov.valor, mov.moeda, moedaSelecionada)
                              return total + valorConvertido
                            }, 0),
                          moedaSelecionada,
                        )}
                      </p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Movimentações</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {
                          movimentacoes.filter(
                            (mov) => mov.conta === contaSelecionada || (!mov.conta && contaSelecionada === "Principal"),
                          ).length
                        }
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resumo Geral de Todas as Contas */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo Geral - Todas as Contas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Saldo Total</p>
                    <p
                      className={`text-xl font-bold ${totaisGerais.saldoTotal >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {formatarValor(totaisGerais.saldoTotal, moedaSelecionada)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Entradas</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatarValor(totaisGerais.entradasTotal, moedaSelecionada)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Saídas</p>
                    <p className="text-xl font-bold text-red-600">
                      {formatarValor(totaisGerais.saidasTotal, moedaSelecionada)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Movimentações</p>
                    <p className="text-xl font-bold text-blue-600">{totaisGerais.movimentacoesTotal}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Formulário de Nova Movimentação */}
            <Card>
              <CardHeader>
                <CardTitle>Nova Movimentação - {contaSelecionada}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Tipo de Movimentação</Label>
                      <Select
                        value={novaMovimentacao.tipo}
                        onValueChange={(value: "entrada" | "saida") =>
                          setNovaMovimentacao({ ...novaMovimentacao, tipo: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entrada">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              Entrada
                            </div>
                          </SelectItem>
                          <SelectItem value="saida">
                            <div className="flex items-center gap-2">
                              <TrendingDown className="h-4 w-4 text-red-600" />
                              Saída
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label>Moeda</Label>
                      <Select
                        value={novaMovimentacao.moeda}
                        onValueChange={(value: "BRL" | "USD") =>
                          setNovaMovimentacao({ ...novaMovimentacao, moeda: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BRL">🇧🇷 Real (BRL)</SelectItem>
                          <SelectItem value="USD">🇺🇸 Dólar (USD)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="titulo">Título *</Label>
                      <Input
                        id="titulo"
                        placeholder="Ex: Venda de serviço, Pagamento de conta..."
                        value={novaMovimentacao.titulo}
                        onChange={(e) => setNovaMovimentacao({ ...novaMovimentacao, titulo: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="data">Data *</Label>
                      <Input
                        id="data"
                        type="date"
                        value={novaMovimentacao.data}
                        onChange={(e) => setNovaMovimentacao({ ...novaMovimentacao, data: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="valor">Valor *</Label>
                      <Input
                        id="valor"
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={novaMovimentacao.valor || ""}
                        onChange={(e) =>
                          setNovaMovimentacao({ ...novaMovimentacao, valor: Number.parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
                      <Select
                        value={novaMovimentacao.formaPagamento}
                        onValueChange={(value) => setNovaMovimentacao({ ...novaMovimentacao, formaPagamento: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dinheiro">Dinheiro</SelectItem>
                          <SelectItem value="pix">PIX</SelectItem>
                          <SelectItem value="cartao-credito">Cartão de Crédito</SelectItem>
                          <SelectItem value="cartao-debito">Cartão de Débito</SelectItem>
                          <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                          <SelectItem value="boleto">Boleto</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {novaMovimentacao.tipo === "saida" && (
                    <div className="grid gap-2">
                      <Label htmlFor="motivo">Motivo da Saída</Label>
                      <Select
                        value={novaMovimentacao.motivo}
                        onValueChange={(value) => setNovaMovimentacao({ ...novaMovimentacao, motivo: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o motivo..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contas">Contas (Luz, Água, Internet, etc.)</SelectItem>
                          <SelectItem value="aluguel">Aluguel</SelectItem>
                          <SelectItem value="alimentacao">Alimentação</SelectItem>
                          <SelectItem value="transporte">Transporte</SelectItem>
                          <SelectItem value="saude">Saúde</SelectItem>
                          <SelectItem value="educacao">Educação</SelectItem>
                          <SelectItem value="lazer">Lazer</SelectItem>
                          <SelectItem value="investimento">Investimento</SelectItem>
                          <SelectItem value="equipamentos">Equipamentos</SelectItem>
                          <SelectItem value="impostos">Impostos</SelectItem>
                          <SelectItem value="outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="observacao">Observação</Label>
                    <textarea
                      id="observacao"
                      className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Observações adicionais..."
                      value={novaMovimentacao.observacao}
                      onChange={(e) => setNovaMovimentacao({ ...novaMovimentacao, observacao: e.target.value })}
                    />
                  </div>

                  <Button onClick={adicionarMovimentacao} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar à {contaSelecionada}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Movimentações da Conta Selecionada */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Movimentações - {contaSelecionada} ({moedaSelecionada})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center border rounded-md px-3 py-2">
                    <Search className="h-5 w-5 text-muted-foreground mr-2" />
                    <Input
                      placeholder="Buscar movimentações..."
                      className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      value={filtroMovimentacoes}
                      onChange={(e) => setFiltroMovimentacoes(e.target.value)}
                    />
                  </div>

                  {filtrarMovimentacoes().length > 0 ? (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Título</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Pagamento</TableHead>
                            <TableHead>Motivo</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filtrarMovimentacoes().map((movimentacao) => (
                            <TableRow key={movimentacao.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {movimentacao.tipo === "entrada" ? (
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                  )}
                                  <span className={movimentacao.tipo === "entrada" ? "text-green-600" : "text-red-600"}>
                                    {movimentacao.tipo === "entrada" ? "Entrada" : "Saída"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{movimentacao.titulo}</p>
                                  {movimentacao.observacao && (
                                    <p className="text-sm text-muted-foreground">{movimentacao.observacao}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{new Date(movimentacao.data).toLocaleDateString("pt-BR")}</TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span
                                    className={
                                      movimentacao.tipo === "entrada"
                                        ? "text-green-600 font-semibold"
                                        : "text-red-600 font-semibold"
                                    }
                                  >
                                    {formatarValor(movimentacao.valorExibicao, moedaSelecionada)}
                                  </span>
                                  {movimentacao.moeda !== moedaSelecionada && (
                                    <span className="text-xs text-muted-foreground">
                                      Original: {formatarValor(movimentacao.valor, movimentacao.moeda)}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{movimentacao.formaPagamento || "-"}</TableCell>
                              <TableCell>{movimentacao.motivo || "-"}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removerMovimentacao(movimentacao.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 border rounded-md bg-muted/20">
                      <div className="flex flex-col items-center gap-2">
                        <Wallet className="h-12 w-12 text-muted-foreground" />
                        <h3 className="font-medium text-lg">Nenhuma movimentação encontrada</h3>
                        <p className="text-muted-foreground">
                          {movimentacoes.filter(
                            (mov) => mov.conta === contaSelecionada || (!mov.conta && contaSelecionada === "Principal"),
                          ).length === 0
                            ? `Adicione a primeira movimentação na conta "${contaSelecionada}".`
                            : `Nenhuma movimentação encontrada na conta "${contaSelecionada}" com os filtros aplicados.`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "os":
        return (
          <div className="space-y-6">
            {osView === "list" ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Ordens de Serviço</h2>
                  <Button onClick={openNewOs}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Ordem de Serviço
                  </Button>
                </div>
                <div className="flex items-center gap-2 border rounded-md px-3 py-2">
                  <Search className="h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar ordens de serviço..."
                    value={osFilter}
                    onChange={(e) => setOsFilter(e.target.value)}
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                {osLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : serviceOrders.length === 0 ? (
                  <div className="text-center py-12 border rounded-md bg-muted/20">
                    <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium text-lg">Nenhuma ordem de serviço encontrada</h3>
                    <p className="text-muted-foreground">Crie sua primeira ordem de serviço!</p>
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Prioridade</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {serviceOrders
                          .filter((order) => 
                            order.number?.toLowerCase().includes(osFilter.toLowerCase()) ||
                            clientes.find((c) => c.id === order.client_id)?.nome?.toLowerCase().includes(osFilter.toLowerCase())
                          )
                          .map((order) => {
                            const client = clientes.find((c) => c.id === order.client_id)
                            return (
                              <TableRow key={order.id}>
                                <TableCell className="font-medium">{order.number}</TableCell>
                                <TableCell>{client?.nome || "N/A"}</TableCell>
                                <TableCell>{order.entry_date ? new Date(order.entry_date).toLocaleDateString("pt-BR") : "N/A"}</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    order.status === "Finalizado" || order.status === "Entregue" ? "bg-green-100 text-green-700" :
                                    order.status === "Cancelado" ? "bg-red-100 text-red-700" :
                                    "bg-yellow-100 text-yellow-700"
                                  }`}>
                                    {order.status}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    order.priority === "Emergencial" ? "bg-red-100 text-red-700" :
                                    order.priority === "Urgente" ? "bg-orange-100 text-orange-700" :
                                    "bg-blue-100 text-blue-700"
                                  }`}>
                                    {order.priority}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => openOs(order.id)}>
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteOs(order.id)}>
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div id="os-pdf" ref={(el) => { if (el) setOsPdfRef(el) }} className="max-w-7xl mx-auto">
                  <div className="flex items-center gap-4 mb-6">
                    <Button variant="outline" onClick={() => setOsView("list")}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar
                    </Button>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold">
                        {currentOsId ? `Ordem de Serviço ${osForm.number}` : "Nova Ordem de Serviço"}
                      </h2>
                    </div>
                    {currentOsId && (
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={generateOsPdf}>
                          <FileText className="h-4 w-4 mr-2" />
                          Gerar PDF
                        </Button>
                      </div>
                    )}
                    <Button onClick={handleSaveOs} disabled={osLoading}>
                      <Save className="h-4 w-4 mr-2" />
                      {osLoading ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>

                  {currentOsId && (
                    <div className="mb-6 flex gap-2 flex-wrap">
                      {STATUS_OPTIONS.map(status => (
                        <Button
                          key={status}
                          variant={osForm.status === status ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleOsStatusChange(status)}
                        >
                          {status}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* =================== PDF-ONLY RECEIPT (NOTA NÃO FISCAL) =================== */}
                  {/* This clean section is what will be captured by html2canvas for the PDF */}
                  <div 
                    ref={(el) => { if (el) setOsReceiptRef(el) }} 
                    className="bg-white w-full max-w-3xl mx-auto mx-auto border border-gray-800 mb-8"
                    style={{ fontFamily: "Arial, sans-serif" }}
                  >
                    {/* ===== TOP HEADER: NOTA NÃO FISCAL ===== */}
                    <div className="bg-gray-100 border-b-2 border-gray-800 p-6 text-center">
                      <h1 className="text-2xl font-black tracking-wider text-gray-800 uppercase">
                        Nota Não Fiscal
                      </h1>
                      <p className="text-sm text-gray-600 mt-1">
                        Comprovante de Ordem de Serviço
                      </p>
                    </div>

                    {/* ===== COMPANY INFO ===== */}
                    <div className="flex justify-between items-start p-6 border-b border-gray-300">
                      <div className="flex items-start gap-4">
                        <img
                          src={configuracoes.logo || "/LOGON.png"}
                          alt="Logo da Empresa"
                          className="h-20 w-auto object-contain"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/LOGON.png" }}
                        />
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">
                            {configuracoes.nomeEmpresa || "Empresa"}
                          </h2>
                          {configuracoes.slogan && (
                            <p className="text-sm text-gray-600">{configuracoes.slogan}</p>
                          )}
                          {configuracoes.endereco && (
                            <p className="text-xs text-gray-600 mt-2">{configuracoes.endereco}</p>
                          )}
                          <div className="flex flex-wrap gap-4 mt-1 text-xs text-gray-600">
                            {configuracoes.whatsapp && <p>📱 {configuracoes.whatsapp}</p>}
                            {configuracoes.telefone && <p>☎️ {configuracoes.telefone}</p>}
                            {configuracoes.email && <p>✉️ {configuracoes.email}</p>}
                          </div>
                        </div>
                      </div>
                      <div className="border-2 border-gray-800 rounded px-6 py-3 text-center">
                        <p className="text-xs text-gray-600 uppercase font-semibold">Número OS</p>
                        <p className="text-3xl font-black text-gray-900 mt-1">
                          {osForm.number || "-"}
                        </p>
                        <div className="mt-3 pt-3 border-t border-gray-300 text-xs text-gray-600 space-y-1 text-left">
                          <p>
                            <span className="font-semibold">Emissão:</span>{" "}
                            {new Date().toLocaleDateString("pt-BR")}
                          </p>
                          {osForm.entry_date && (
                            <p>
                              <span className="font-semibold">Entrada:</span>{" "}
                              {new Date(osForm.entry_date).toLocaleDateString("pt-BR")}
                            </p>
                          )}
                          <p>
                            <span className="font-semibold">Status:</span>{" "}
                            {osForm.status || "Recebido"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ===== CLIENT DATA ===== */}
                    <div className="p-6 border-b border-gray-300">
                      <h3 className="text-sm font-bold uppercase bg-gray-800 text-white px-3 py-1.5 mb-4 inline-block">
                        Dados do Cliente
                      </h3>
                      {(() => {
                        const client = clientes.find((c) => c.id === osForm.client_id)
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8 text-sm text-gray-800">
                            <div className="col-span-full border-b pb-1 border-gray-200">
                              <p className="text-xs text-gray-500 uppercase font-semibold">Nome Completo / Razão Social</p>
                              <p className="font-medium text-base">{client?.nome || "Não informado"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase font-semibold">CPF / CNPJ</p>
                              <p className="font-medium">{client?.cpfCnpj || "Não informado"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase font-semibold">Telefone / WhatsApp</p>
                              <p className="font-medium">{client?.telefone || "Não informado"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase font-semibold">E-mail</p>
                              <p className="font-medium">{client?.email || "Não informado"}</p>
                            </div>
                            <div className="col-span-full">
                              <p className="text-xs text-gray-500 uppercase font-semibold">Endereço</p>
                              <p className="font-medium">{client?.endereco || "Não informado"}</p>
                            </div>
                          </div>
                        )
                      })()}
                    </div>

                    {/* ===== EQUIPMENT / PRODUCTS ===== */}
                    <div className="p-6 border-b border-gray-300">
                      <h3 className="text-sm font-bold uppercase bg-gray-800 text-white px-3 py-1.5 mb-4 inline-block">
                        Equipamento(s) / Produto(s)
                      </h3>
                      {osEquipment.length === 0 ? (
                        <p className="text-sm italic text-gray-500">Nenhum equipamento cadastrado.</p>
                      ) : (
                        <div className="space-y-4">
                          {osEquipment.map((eq: any, idx: number) => (
                            <div key={eq.id} className="border border-gray-400 rounded p-4 bg-gray-50">
                              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-300">
                                <h4 className="font-bold text-gray-900">Item {idx + 1}: {eq.category || "Equipamento"}</h4>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-4 text-sm">
                                {eq.brand && (
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Marca</p>
                                    <p className="font-medium">{eq.brand}</p>
                                  </div>
                                )}
                                {eq.model && (
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Modelo</p>
                                    <p className="font-medium">{eq.model}</p>
                                  </div>
                                )}
                                {eq.serial_number && (
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Número de Série</p>
                                    <p className="font-medium">{eq.serial_number}</p>
                                  </div>
                                )}
                                {eq.imei && (
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold">IMEI</p>
                                    <p className="font-medium">{eq.imei}</p>
                                  </div>
                                )}
                                {eq.color && (
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Cor</p>
                                    <p className="font-medium">{eq.color}</p>
                                  </div>
                                )}
                                {eq.physical_condition && (
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Estado Físico</p>
                                    <p className="font-medium">{eq.physical_condition}</p>
                                  </div>
                                )}
                                {Array.isArray(eq.accessories) && eq.accessories.length > 0 && (
                                  <div className="col-span-full mt-2">
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Acessórios Entregues</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {eq.accessories.map((acc: string) => (
                                        <span key={acc} className="bg-white border border-gray-300 rounded px-2 py-0.5 text-xs font-medium">
                                          {acc}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {eq.observations && (
                                  <div className="col-span-full mt-2">
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Observações</p>
                                    <p className="font-medium bg-white p-2 rounded border border-gray-300 text-sm">{eq.observations}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ===== SERVICE DETAILS ===== */}
                    <div className="p-6 border-b border-gray-300 space-y-5">
                      {osForm.customer_defect && (
                        <div>
                          <h3 className="text-sm font-bold uppercase bg-gray-800 text-white px-3 py-1.5 mb-3 inline-block">
                            Defeito Informado
                          </h3>
                          <div className="bg-gray-50 border border-gray-300 rounded p-3 text-sm text-gray-800 whitespace-pre-wrap">
                            {osForm.customer_defect}
                          </div>
                        </div>
                      )}
                      {osForm.technical_diagnosis && (
                        <div>
                          <h3 className="text-sm font-bold uppercase bg-gray-800 text-white px-3 py-1.5 mb-3 inline-block">
                            Diagnóstico Técnico
                          </h3>
                          <div className="bg-gray-50 border border-gray-300 rounded p-3 text-sm text-gray-800 whitespace-pre-wrap">
                            {osForm.technical_diagnosis}
                          </div>
                        </div>
                      )}
                      {osForm.service_executed && (
                        <div>
                          <h3 className="text-sm font-bold uppercase bg-gray-800 text-white px-3 py-1.5 mb-3 inline-block">
                            Serviço Executado
                          </h3>
                          <div className="bg-gray-50 border border-gray-300 rounded p-3 text-sm text-gray-800 whitespace-pre-wrap">
                            {osForm.service_executed}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ===== PARTS TABLE ===== */}
                    {osParts.length > 0 && (
                      <div className="p-6 border-b border-gray-300">
                        <h3 className="text-sm font-bold uppercase bg-gray-800 text-white px-3 py-1.5 mb-4 inline-block">
                          Peças / Materiais Aplicados
                        </h3>
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="bg-gray-200 border-y-2 border-gray-800">
                              <th className="text-left px-3 py-2 font-semibold text-gray-800 uppercase text-xs">Item</th>
                              <th className="text-center px-3 py-2 font-semibold text-gray-800 uppercase text-xs">Qtd</th>
                              <th className="text-right px-3 py-2 font-semibold text-gray-800 uppercase text-xs">Unitário</th>
                              <th className="text-right px-3 py-2 font-semibold text-gray-800 uppercase text-xs">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {osParts.map((part: any, idx: number) => (
                              <tr key={part.id} className="border-b border-gray-300">
                                <td className="px-3 py-2">{idx + 1}. {part.part_name}</td>
                                <td className="px-3 py-2 text-center">{part.quantity}</td>
                                <td className="px-3 py-2 text-right">{Number(part.unit_price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                                <td className="px-3 py-2 text-right font-semibold">{Number(part.total_price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* ===== FINANCIAL SUMMARY ===== */}
                    <div className="p-6 border-b border-gray-300">
                      <h3 className="text-sm font-bold uppercase bg-gray-800 text-white px-3 py-1.5 mb-4 inline-block">
                        Resumo Financeiro
                      </h3>
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 space-y-2.5 text-sm">
                          <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
                            <span className="text-gray-700 font-medium">Total de Peças / Materiais</span>
                            <span className="text-gray-900 font-semibold">
                              {Number(osForm.parts_value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
                            <span className="text-gray-700 font-medium">Mão de Obra / Serviço</span>
                            <span className="text-gray-900 font-semibold">
                              {Number(osForm.labor_value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
                            <span className="text-gray-700 font-medium">Frete / Deslocamento</span>
                            <span className="text-gray-900 font-semibold">
                              {Number(osForm.shipping_value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </span>
                          </div>
                          {(osForm.discount ?? 0) > 0 && (
                            <div className="flex justify-between items-center py-1.5 border-b border-gray-200 text-red-600">
                              <span className="font-medium">(-) Desconto Aplicado</span>
                              <span className="font-semibold">
                                - {Number(osForm.discount ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="md:w-64 border-4 border-gray-800 bg-gray-100 rounded-lg flex items-center justify-center p-6">
                          <div className="text-center">
                            <p className="text-xs uppercase text-gray-600 font-bold tracking-wide">
                              Valor Total da OS
                            </p>
                            <p className="text-4xl font-black text-gray-900 mt-2 leading-tight">
                              {Number(
                                (osForm.parts_value ?? 0) +
                                (osForm.labor_value ?? 0) +
                                (osForm.shipping_value ?? 0) -
                                (osForm.discount ?? 0)
                              ).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </p>
                            {osForm.payment_method && (
                              <p className="text-sm text-gray-700 font-medium mt-3 pt-3 border-t border-gray-300">
                                {osForm.payment_method}
                                {osForm.installments && osForm.installments > 1 && ` • ${osForm.installments}x`}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ===== WARRANTY ===== */}
                    {(osForm.warranty || osForm.warranty_term) && (
                      <div className="p-6 border-b border-gray-300">
                        <h3 className="text-sm font-bold uppercase bg-gray-800 text-white px-3 py-1.5 mb-3 inline-block">
                          Termos de Garantia
                        </h3>
                        {osForm.warranty_term && (
                          <p className="text-sm text-gray-800 mb-2">
                            <span className="font-semibold">Prazo de Garantia: </span>
                            {osForm.warranty_term}
                          </p>
                        )}
                        {osForm.warranty && (
                          <div className="bg-amber-50 border border-amber-300 rounded p-3 text-sm text-gray-800 whitespace-pre-wrap">
                            {osForm.warranty}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ===== QR CODE SECTION (instead of signatures) ===== */}
                    <div className="p-6">
                      <div className="border-2 border-gray-800 rounded-lg bg-gray-50 p-6 flex flex-col md:flex-row items-center gap-6">
                        <div className="flex-1">
                          <h3 className="text-lg font-black text-gray-900 uppercase mb-2 flex items-center gap-2">
                            📱 Acompanhe e Assine Digitalmente
                          </h3>
                          <p className="text-sm text-gray-700 mb-3">
                            Escaneie o QR Code ao lado com a câmera do seu celular para:
                          </p>
                          <ul className="text-sm text-gray-800 space-y-1.5 mb-4">
                            <li className="flex items-start gap-2">
                              <span className="text-green-600 font-bold">✓</span>
                              <span>Acompanhar o status e todo o histórico da ordem de serviço</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-green-600 font-bold">✓</span>
                              <span>Visualizar fotos do equipamento (entrada, reparo e saída)</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-green-600 font-bold">✓</span>
                              <span>Assinar digitalmente o recebimento do equipamento</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-green-600 font-bold">✓</span>
                              <span>Baixar o comprovante sempre que precisar</span>
                            </li>
                          </ul>
                          {currentOsId && osForm.portal_token && (
                            <div className="bg-white border border-gray-300 rounded p-3 break-all text-xs text-blue-700 font-mono">
                              {typeof window !== 'undefined' ? window.location.origin : ''}/os/portal/{osForm.portal_token}
                            </div>
                          )}
                        </div>
                        {currentOsId && osForm.portal_token && (
                          <div className="flex flex-col items-center">
                            <div className="bg-white p-3 border-4 border-gray-800 rounded-lg shadow-md">
                              <QRCodeSVG
                                value={
                                  typeof window !== 'undefined'
                                    ? `${window.location.origin}/os/portal/${osForm.portal_token}`
                                    : `/os/portal/${osForm.portal_token}`
                                }
                                size={180}
                                level="H"
                                includeMargin={true}
                              />
                            </div>
                            <p className="text-xs text-gray-600 mt-3 text-center max-w-[210px] font-medium">
                              Aponte a câmera do celular para o QR Code
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ===== FOOTER ===== */}
                    <div className="bg-gray-800 text-white p-4 text-center text-xs text-gray-300">
                      <p className="font-semibold text-white mb-1">
                        {configuracoes.nomeEmpresa || "Empresa"}
                      </p>
                      <p>
                        Documento gerado eletronicamente em {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  {/* =================== END PDF-ONLY RECEIPT =================== */}

                  {/* PREVIEW CARD: shown in UI so user can see the receipt before generating PDF */}
                  <div className="mb-8 text-center">
                    <div className="inline-flex items-center gap-2 text-sm text-gray-500 bg-gray-100 rounded-full px-4 py-2 border border-gray-200">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span>Prévia do comprovante que será gerado em PDF</span>
                    </div>
                  </div>

                  <Tabs value={osActiveTab} onValueChange={setOsActiveTab} className="w-full">
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
                                <Input value={osForm.number} disabled placeholder="Gerado automaticamente" />
                              </div>
                              <div>
                                <Label>Cliente *</Label>
                                <Select value={osForm.client_id} onValueChange={(v) => setOsForm(prev => ({ ...prev, client_id: v }))}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um cliente" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {clientes.map((client) => (
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
                                  value={osForm.entry_date ? osForm.entry_date.split("T")[0] : ""} 
                                  onChange={(e) => setOsForm(prev => ({ ...prev, entry_date: e.target.value }))} 
                                />
                              </div>
                              <div>
                                <Label>Previsão de Entrega</Label>
                                <Input 
                                  type="date" 
                                  value={osForm.expected_delivery_date ? osForm.expected_delivery_date.split("T")[0] : ""} 
                                  onChange={(e) => setOsForm(prev => ({ ...prev, expected_delivery_date: e.target.value }))} 
                                />
                              </div>
                              <div>
                                <Label>Técnico Responsável</Label>
                                <Input 
                                  value={osForm.technician} 
                                  onChange={(e) => setOsForm(prev => ({ ...prev, technician: e.target.value }))} 
                                />
                              </div>
                              <div>
                                <Label>Prioridade</Label>
                                <Select value={osForm.priority} onValueChange={(v) => setOsForm(prev => ({ ...prev, priority: v }))}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {PRIORITY_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Origem</Label>
                                <Select value={osForm.origin} onValueChange={(v) => setOsForm(prev => ({ ...prev, origin: v }))}>
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
                                value={osForm.customer_defect ?? ""} 
                                onChange={(e) => setOsForm(prev => ({ ...prev, customer_defect: e.target.value }))}
                                rows={4}
                              />
                            </div>
                            <div>
                              <Label>Diagnóstico Técnico</Label>
                              <Textarea 
                                value={osForm.technical_diagnosis ?? ""} 
                                onChange={(e) => setOsForm(prev => ({ ...prev, technical_diagnosis: e.target.value }))}
                                rows={4}
                              />
                            </div>
                            <div>
                              <Label>Serviço Executado</Label>
                              <Textarea 
                                value={osForm.service_executed ?? ""} 
                                onChange={(e) => setOsForm(prev => ({ ...prev, service_executed: e.target.value }))}
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
                                  value={osForm.parts_value ?? 0} 
                                  onChange={(e) => setOsForm(prev => ({ ...prev, parts_value: parseFloat(e.target.value) || 0 }))} 
                                />
                              </div>
                              <div>
                                <Label>Valor da Mão de Obra</Label>
                                <Input 
                                  type="number" 
                                  value={osForm.labor_value ?? 0} 
                                  onChange={(e) => setOsForm(prev => ({ ...prev, labor_value: parseFloat(e.target.value) || 0 }))} 
                                />
                              </div>
                              <div>
                                <Label>Desconto</Label>
                                <Input 
                                  type="number" 
                                  value={osForm.discount ?? 0} 
                                  onChange={(e) => setOsForm(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))} 
                                />
                              </div>
                              <div>
                                <Label>Frete</Label>
                                <Input 
                                  type="number" 
                                  value={osForm.shipping_value ?? 0} 
                                  onChange={(e) => setOsForm(prev => ({ ...prev, shipping_value: parseFloat(e.target.value) || 0 }))} 
                                />
                              </div>
                              <div>
                                <Label>Valor Total</Label>
                                <Input value={(osForm.parts_value ?? 0) + (osForm.labor_value ?? 0) + (osForm.shipping_value ?? 0) - (osForm.discount ?? 0)} disabled />
                              </div>
                              <div>
                                <Label>Forma de Pagamento</Label>
                                <Input 
                                  value={osForm.payment_method ?? ""} 
                                  onChange={(e) => setOsForm(prev => ({ ...prev, payment_method: e.target.value }))} 
                                />
                              </div>
                              <div>
                                <Label>Parcelas</Label>
                                <Input 
                                  type="number" 
                                  value={osForm.installments ?? 1} 
                                  onChange={(e) => setOsForm(prev => ({ ...prev, installments: parseInt(e.target.value) || 1 }))} 
                                />
                              </div>
                              <div>
                                <Label>Status do Pagamento</Label>
                                <Input 
                                  value={osForm.payment_status ?? ""} 
                                  onChange={(e) => setOsForm(prev => ({ ...prev, payment_status: e.target.value }))} 
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
                                value={osForm.warranty ?? ""} 
                                onChange={(e) => setOsForm(prev => ({ ...prev, warranty: e.target.value }))}
                                rows={3}
                              />
                            </div>
                            <div>
                              <Label>Prazo da Garantia</Label>
                              <Input 
                                value={osForm.warranty_term ?? ""} 
                                onChange={(e) => setOsForm(prev => ({ ...prev, warranty_term: e.target.value }))} 
                              />
                            </div>
                          </CardContent>
                        </Card>

                        {currentOsId && (
                          <Card>
                            <CardHeader>
                              <CardTitle>Assinaturas</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="text-center">
                                  <h4 className="font-medium mb-2">Assinatura de Entrada</h4>
                                  {osForm.entry_signature ? (
                                    <img src={osForm.entry_signature} alt="Assinatura de entrada" className="mx-auto h-32 border rounded" />
                                  ) : (
                                    <div className="h-32 border rounded flex items-center justify-center text-gray-400">
                                      Sem assinatura
                                    </div>
                                  )}
                                  <Button 
                                    variant="outline" 
                                    className="mt-2"
                                    onClick={() => {
                                      setOsShowSignatureDialog("entrada")
                                      setTimeout(() => {
                                        initOsSignatureCanvas()
                                      }, 100)
                                    }}
                                  >
                                    {osForm.entry_signature ? "Reassinar" : "Assinar"}
                                  </Button>
                                </div>
                                <div className="text-center">
                                  <h4 className="font-medium mb-2">Assinatura de Saída</h4>
                                  {osForm.exit_signature ? (
                                    <img src={osForm.exit_signature} alt="Assinatura de saída" className="mx-auto h-32 border rounded" />
                                  ) : (
                                    <div className="h-32 border rounded flex items-center justify-center text-gray-400">
                                      Sem assinatura
                                    </div>
                                  )}
                                  <Button 
                                    variant="outline" 
                                    className="mt-2"
                                    onClick={() => {
                                      setOsShowSignatureDialog("saída")
                                      setTimeout(() => {
                                        initOsSignatureCanvas()
                                      }, 100)
                                    }}
                                  >
                                    {osForm.exit_signature ? "Reassinar" : "Assinar"}
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
                        {currentOsId && (
                          <Card>
                            <CardHeader>
                              <CardTitle>Adicionar Equipamento</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                  <Label>Categoria *</Label>
                                  <Select value={newOsEquipment.category} onValueChange={(v) => setNewOsEquipment(prev => ({ ...prev, category: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                    <SelectContent>
                                      {EQUIPMENT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Marca</Label>
                                  <Input value={newOsEquipment.brand} onChange={(e) => setNewOsEquipment(prev => ({ ...prev, brand: e.target.value }))} />
                                </div>
                                <div>
                                  <Label>Modelo</Label>
                                  <Input value={newOsEquipment.model} onChange={(e) => setNewOsEquipment(prev => ({ ...prev, model: e.target.value }))} />
                                </div>
                                <div>
                                  <Label>Número de Série</Label>
                                  <Input value={newOsEquipment.serial_number} onChange={(e) => setNewOsEquipment(prev => ({ ...prev, serial_number: e.target.value }))} />
                                </div>
                                <div>
                                  <Label>IMEI</Label>
                                  <Input value={newOsEquipment.imei} onChange={(e) => setNewOsEquipment(prev => ({ ...prev, imei: e.target.value }))} />
                                </div>
                                <div>
                                  <Label>Cor</Label>
                                  <Input value={newOsEquipment.color} onChange={(e) => setNewOsEquipment(prev => ({ ...prev, color: e.target.value }))} />
                                </div>
                                <div>
                                  <Label>Processador</Label>
                                  <Input value={newOsEquipment.processor} onChange={(e) => setNewOsEquipment(prev => ({ ...prev, processor: e.target.value }))} />
                                </div>
                                <div>
                                  <Label>Memória RAM</Label>
                                  <Input value={newOsEquipment.ram} onChange={(e) => setNewOsEquipment(prev => ({ ...prev, ram: e.target.value }))} />
                                </div>
                                <div>
                                  <Label>Armazenamento</Label>
                                  <Input value={newOsEquipment.storage} onChange={(e) => setNewOsEquipment(prev => ({ ...prev, storage: e.target.value }))} />
                                </div>
                                <div>
                                  <Label>Sistema Operacional</Label>
                                  <Input value={newOsEquipment.operating_system} onChange={(e) => setNewOsEquipment(prev => ({ ...prev, operating_system: e.target.value }))} />
                                </div>
                                <div>
                                  <Label>Senha Informada</Label>
                                  <Input type="password" value={newOsEquipment.password} onChange={(e) => setNewOsEquipment(prev => ({ ...prev, password: e.target.value }))} />
                                </div>
                                <div>
                                  <Label>Estado Físico</Label>
                                  <Input value={newOsEquipment.physical_condition} onChange={(e) => setNewOsEquipment(prev => ({ ...prev, physical_condition: e.target.value }))} />
                                </div>
                                <div className="col-span-full">
                                  <Label>Observações</Label>
                                  <Textarea value={newOsEquipment.observations} onChange={(e) => setNewOsEquipment(prev => ({ ...prev, observations: e.target.value }))} />
                                </div>
                                <div className="col-span-full">
                                  <Label>Acessórios Entregues</Label>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                                    {ACCESSORY_OPTIONS.map(acc => (
                                      <div key={acc} className="flex items-center gap-2">
                                        <Checkbox 
                                          id={`os-acc-${acc}`}
                                          checked={newOsEquipment.accessories.includes(acc)}
                                          onCheckedChange={(checked) => {
                                            setNewOsEquipment(prev => ({
                                              ...prev,
                                              accessories: checked 
                                                ? [...prev.accessories, acc] 
                                                : prev.accessories.filter(a => a !== acc)
                                            }))
                                          }}
                                        />
                                        <label htmlFor={`os-acc-${acc}`} className="text-sm">{acc}</label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <Button onClick={handleAddOsEquipment}>
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar Equipamento
                              </Button>
                            </CardContent>
                          </Card>
                        )}

                        {osEquipment.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle>Equipamentos Cadastrados</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {osEquipment.map(eq => (
                                  <div key={eq.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <h4 className="font-medium">{eq.category} - {eq.brand} {eq.model}</h4>
                                        <p className="text-sm text-gray-500">Número de Série: {eq.serial_number || "N/A"}</p>
                                      </div>
                                      {currentOsId && (
                                        <Button variant="destructive" size="sm" onClick={() => handleRemoveOsEquipment(eq.id)}>
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      )}
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
                        {currentOsId && (
                          <Card>
                            <CardHeader>
                              <CardTitle>Adicionar Peça</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                  <Label>Peça</Label>
                                  <Input value={newOsPart.part_name} onChange={(e) => setNewOsPart(prev => ({ ...prev, part_name: e.target.value }))} />
                                </div>
                                <div>
                                  <Label>Quantidade</Label>
                                  <Input 
                                    type="number" 
                                    value={newOsPart.quantity} 
                                    onChange={(e) => {
                                      const qty = parseInt(e.target.value) || 1
                                      setNewOsPart(prev => ({ 
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
                                    value={newOsPart.unit_price} 
                                    onChange={(e) => {
                                      const price = parseFloat(e.target.value) || 0
                                      setNewOsPart(prev => ({ 
                                        ...prev, 
                                        unit_price: price,
                                        total_price: prev.quantity * price 
                                      }))
                                    }} 
                                  />
                                </div>
                                <div>
                                  <Label>Valor Total</Label>
                                  <Input value={newOsPart.total_price} disabled />
                                </div>
                              </div>
                              <Button onClick={handleAddOsPart}>
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar Peça
                              </Button>
                            </CardContent>
                          </Card>
                        )}

                        {osParts.length > 0 && (
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
                                  {osParts.map(part => (
                                    <TableRow key={part.id}>
                                      <TableCell>{part.part_name}</TableCell>
                                      <TableCell>{part.quantity}</TableCell>
                                      <TableCell>{part.unit_price}</TableCell>
                                      <TableCell>{part.total_price}</TableCell>
                                      <TableCell>
                                        {currentOsId && (
                                          <Button variant="destructive" size="sm" onClick={() => handleRemoveOsPart(part.id)}>
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        )}
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
                        {!currentOsId ? (
                          <Card>
                            <CardContent className="pt-6 text-sm text-gray-500">
                              Salve a OS primeiro para habilitar o checklist técnico.
                            </CardContent>
                          </Card>
                        ) : osEquipment.length === 0 ? (
                          <Card>
                            <CardContent className="pt-6 text-sm text-gray-500">
                              Adicione ao menos um equipamento para montar o checklist.
                            </CardContent>
                          </Card>
                        ) : (
                          osEquipment.map((equipmentItem) => {
                            const savedChecklist = osChecklists.find(
                              (entry) => entry.equipment_category === equipmentItem.category
                            )
                            const checklistItems = (savedChecklist?.items?.length
                              ? savedChecklist.items
                              : getOsChecklistTemplate(equipmentItem.category).map((label) => ({
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
                                            handleToggleOsChecklistItem(equipmentItem, item.label, checked === true)
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
                        {currentOsId && (
                          <Card>
                            <CardHeader>
                              <CardTitle>Enviar Mídia</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="mb-4">
                                <Label>Etapa</Label>
                                <Select value={osMediaStage} onValueChange={(v: any) => setOsMediaStage(v)}>
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
                                onClick={() => {
                                  const input = document.createElement("input")
                                  input.type = "file"
                                  input.accept = "image/*,video/*"
                                  input.multiple = true
                                  input.onchange = (e) => handleOsFileUpload((e.target as HTMLInputElement).files)
                                  input.click()
                                }}
                              >
                                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p className="text-gray-600">Clique ou arraste arquivos para enviar</p>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        <Card>
                          <CardHeader>
                            <CardTitle>Galeria</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {["Entrada", "Durante o Reparo", "Saída"].map(stage => {
                              const stageMedia = osMedia.filter(m => m.stage === stage)
                              if (stageMedia.length === 0) return null
                              
                              return (
                                <div key={stage} className="mb-6">
                                  <h4 className="font-medium mb-3">{stage}</h4>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {stageMedia.map(m => (
                                      <div key={m.id} className="relative group">
                                        {m.file_type === "image" ? (
                                          <img src={m.file_url} alt={m.file_name} className="w-full h-32 object-cover rounded" />
                                        ) : (
                                          <video src={m.file_url} className="w-full h-32 object-cover rounded" />
                                        )}
                                        {currentOsId && (
                                          <Button 
                                            variant="destructive" 
                                            size="sm" 
                                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                                            onClick={() => handleRemoveOsMedia(m.id)}
                                          >
                                            <Trash2 className="h-4 w-4" />
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
                          {osTimeline.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">Nenhuma entrada no histórico</div>
                          ) : (
                            <div className="space-y-4">
                              {osTimeline.map((entry, index) => (
                                <div key={entry.id} className="flex gap-4">
                                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                                  <div className="flex-1">
                                    <p className="text-sm">{entry.action}</p>
                                    <p className="text-xs text-gray-500">
                                      {entry.user_name} - {new Date(entry.timestamp).toLocaleString("pt-BR")}
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
              </div>
            )}

            {/* Signature Dialog */}
            {osShowSignatureDialog && (
              <Dialog open={!!osShowSignatureDialog} onOpenChange={() => setOsShowSignatureDialog(null)}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Assinatura {osShowSignatureDialog}</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col items-center">
                    <canvas
                      ref={(el) => setOsSignatureCanvasRef(el)}
                      width={400}
                      height={200}
                      className="border rounded bg-white touch-none"
                      onMouseDown={startOsDrawing}
                      onMouseMove={drawOs}
                      onMouseUp={stopOsDrawing}
                      onMouseLeave={stopOsDrawing}
                      onTouchStart={startOsDrawing}
                      onTouchMove={drawOs}
                      onTouchEnd={stopOsDrawing}
                    />
                  </div>
                  <DialogFooter className="flex justify-between">
                    <Button variant="outline" onClick={clearOsSignature}>Limpar</Button>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setOsShowSignatureDialog(null)}>Cancelar</Button>
                      <Button onClick={saveOsSignature}>Salvar</Button>
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )
      default:
        return null
    }
  }

  useEffect(() => {
    // Buscar cotação do USD
    buscarCotacaoUSD()

    // Atualizar cotação a cada 5 minutos
    const interval = setInterval(buscarCotacaoUSD, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  // Adicionar este useEffect after o useEffect existente da carteira
  useEffect(() => {
    // Converter valores quando a moeda for alterada
    if (movimentacoes.length > 0) {
      const movimentacoesConvertidas = movimentacoes.map((mov) => {
        // Se a movimentação está em moeda diferente da selecionada, converter para visualização
        if (mov.moeda !== moedaSelecionada) {
          return {
            ...mov,
            valorConvertido: converterValor(mov.valor, mov.moeda, moedaSelecionada),
            moedaOriginal: mov.moeda,
            valorOriginal: mov.valor,
          }
        }
        return {
          ...mov,
          valorConvertido: mov.valor,
          moedaOriginal: mov.moeda,
          valorOriginal: mov.valor,
        }
      })

      // Não precisamos salvar as conversões, apenas usar para exibição
    }
  }, [moedaSelecionada, cotacaoUSD, movimentacoes])

  // OS Functions
  const loadServiceOrders = async () => {
    try {
      setOsLoading(true)
      const orders = await fetchServiceOrders()
      setServiceOrders(orders)
    } catch (error) {
      console.error("Error loading service orders:", error)
      toast({ title: "Erro ao carregar ordens de serviço", variant: "destructive" })
    } finally {
      setOsLoading(false)
    }
  }

  const loadOsData = async (id: string) => {
    try {
      setOsLoading(true)
      const order = await getServiceOrderById(id)
      // Merge with default form values to ensure no undefined values for controlled components
      const defaultForm = {
        number: "",
        client_id: "",
        entry_date: new Date().toISOString().split("T")[0],
        expected_delivery_date: "",
        technician: "",
        priority: "Normal",
        origin: "Loja",
        status: "Recebido",
        customer_defect: "",
        technical_diagnosis: "",
        service_executed: "",
        parts_value: 0,
        labor_value: 0,
        discount: 0,
        shipping_value: 0,
        total_value: 0,
        payment_method: "",
        installments: 1,
        payment_status: "",
        warranty: "",
        warranty_term: "",
        portal_token: generateUUID(),
        entry_signature: "",
        exit_signature: "",
      }
      setOsForm({ ...defaultForm, ...order })
      const [equipment, parts, checklists, timeline, media] = await Promise.all([
        fetchServiceEquipment(id),
        fetchServiceParts(id),
        fetchServiceChecklists(id),
        fetchServiceTimeline(id),
        fetchServiceMedia(id)
      ])
      setOsEquipment(equipment)
      setOsParts(parts)
      setOsChecklists(checklists)
      setOsTimeline(timeline)
      setOsMedia(media)
    } catch (error) {
      console.error("Error loading OS data:", error)
      toast({ title: "Erro ao carregar ordem de serviço", variant: "destructive" })
    } finally {
      setOsLoading(false)
    }
  }

  const generateOsNumber = async () => {
    try {
      const orders = await fetchServiceOrders()
      return `OS-${String(orders.length + 1).padStart(6, "0")}`
    } catch {
      return `OS-${String(Date.now()).slice(-6)}`
    }
  }

  const handleSaveOs = async () => {
    if (!osForm.client_id) {
      toast({ title: "Cliente obrigatório", variant: "destructive" })
      return
    }
    try {
      let orderNumber = osForm.number
      if (!currentOsId && !orderNumber) {
        orderNumber = await generateOsNumber()
      }

      // Calculate total value automatically
      const total_value = (osForm.parts_value || 0) + (osForm.labor_value || 0) + (osForm.shipping_value || 0) - (osForm.discount || 0)

      const savedOrder = await saveServiceOrder({
        ...osForm,
        id: currentOsId || undefined,
        number: orderNumber,
        total_value: total_value,
        updated_at: new Date().toISOString()
      })

      if (!currentOsId) {
        await addTimelineEntry({
          service_order_id: savedOrder.id,
          action: "Ordem de serviço criada",
          user_name: "Sistema",
          timestamp: new Date().toISOString()
        })
        setCurrentOsId(savedOrder.id)
        setOsForm(savedOrder)
        await loadOsData(savedOrder.id)
      } else {
        setOsForm(savedOrder)
      }

      await loadServiceOrders()
      toast({ title: currentOsId ? "Ordem de serviço atualizada" : "Ordem de serviço criada" })
    } catch (error: any) {
      console.error("Error saving OS:", error)
      console.error("Error details:", error?.message || JSON.stringify(error))
      toast({ 
        title: "Erro ao salvar ordem de serviço", 
        description: error?.message || "Ocorreu um erro inesperado", 
        variant: "destructive" 
      })
    }
  }

  const handleDeleteOs = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta ordem de serviço?")) return
    try {
      await deleteServiceOrder(id)
      await loadServiceOrders()
      if (currentOsId === id) {
        setOsView("list")
        setCurrentOsId(null)
      }
      toast({ title: "Ordem de serviço removida" })
    } catch (error) {
      console.error("Error deleting OS:", error)
      toast({ title: "Erro ao remover ordem de serviço", variant: "destructive" })
    }
  }

  const handleAddOsEquipment = async () => {
    if (!newOsEquipment.category || !currentOsId) return
    try {
      const saved = await saveServiceEquipment({
        ...newOsEquipment,
        service_order_id: currentOsId
      })
      setOsEquipment([...osEquipment, saved])
      setNewOsEquipment({
        category: "",
        brand: "",
        model: "",
        serial_number: "",
        imei: "",
        color: "",
        processor: "",
        ram: "",
        storage: "",
        operating_system: "",
        password: "",
        physical_condition: "",
        observations: "",
        accessories: [],
      })
      toast({ title: "Equipamento adicionado" })
    } catch (error) {
      console.error("Error adding equipment:", error)
      toast({ title: "Erro ao adicionar equipamento", variant: "destructive" })
    }
  }

  const handleRemoveOsEquipment = async (id: string) => {
    try {
      await deleteServiceEquipment(id)
      setOsEquipment(osEquipment.filter(e => e.id !== id))
      toast({ title: "Equipamento removido" })
    } catch (error) {
      console.error("Error removing equipment:", error)
      toast({ title: "Erro ao remover equipamento", variant: "destructive" })
    }
  }

  const handleAddOsPart = async () => {
    if (!newOsPart.part_name || newOsPart.unit_price <= 0 || !currentOsId) return
    const total = newOsPart.quantity * newOsPart.unit_price
    try {
      const saved = await saveServicePart({
        ...newOsPart,
        total_price: total,
        service_order_id: currentOsId
      })
      setOsParts([...osParts, saved])
      setNewOsPart({ part_name: "", quantity: 1, unit_price: 0, total_price: 0 })
      const newPartsValue = osParts.reduce((sum, p) => sum + (p.total_price || 0), 0) + total
      setOsForm(prev => ({ ...prev, parts_value: newPartsValue }))
      toast({ title: "Peça adicionada" })
    } catch (error) {
      console.error("Error adding part:", error)
      toast({ title: "Erro ao adicionar peça", variant: "destructive" })
    }
  }

  const handleRemoveOsPart = async (id: string) => {
    try {
      await deleteServicePart(id)
      const newParts = osParts.filter(p => p.id !== id)
      setOsParts(newParts)
      const newPartsValue = newParts.reduce((sum, p) => sum + (p.total_price || 0), 0)
      setOsForm(prev => ({ ...prev, parts_value: newPartsValue }))
      toast({ title: "Peça removida" })
    } catch (error) {
      console.error("Error removing part:", error)
      toast({ title: "Erro ao remover peça", variant: "destructive" })
    }
  }

  const getOsChecklistTemplate = (category: string) => {
    return CHECKLISTS[category] || ["Liga", "Carrega", "Imagem", "Som", "Conectividade", "Estado físico"]
  }

  const handleToggleOsChecklistItem = async (equipmentItem: any, itemLabel: string, checked: boolean) => {
    const existingChecklist = osChecklists.find((entry) => entry.equipment_category === equipmentItem.category)
    const currentItems = Array.isArray(existingChecklist?.items) ? existingChecklist.items : []
    const existingItem = currentItems.find((item: any) => item.label === itemLabel)
    const nextItems = currentItems.length > 0
      ? currentItems.map((item: any) => item.label === itemLabel ? { ...item, checked } : item)
      : getOsChecklistTemplate(equipmentItem.category).map((label) => ({
          label,
          checked: label === itemLabel ? checked : false,
        }))
    if (!existingItem && currentItems.length > 0) {
      nextItems.push({ label: itemLabel, checked })
    }
    try {
      const savedChecklist = await saveServiceChecklist({
        id: existingChecklist?.id,
        service_order_id: currentOsId,
        equipment_category: equipmentItem.category,
        items: nextItems,
      })
      setOsChecklists((prev) => {
        const remaining = prev.filter((entry) => entry.id !== savedChecklist.id && entry.equipment_category !== equipmentItem.category)
        return [...remaining, savedChecklist]
      })
      toast({ title: "Checklist atualizado" })
    } catch (error) {
      console.error("Error saving checklist:", error)
      toast({ title: "Erro ao salvar checklist", variant: "destructive" })
    }
  }

  const handleOsFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !currentOsId) return
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const url = await uploadImage(file)
        const saved = await saveServiceMedia({
          service_order_id: currentOsId,
          stage: osMediaStage,
          file_url: url,
          file_type: file.type.startsWith("image") ? "image" : "video",
          file_name: file.name,
          order_index: osMedia.length + i
        })
        setOsMedia([...osMedia, saved])
      } catch (error) {
        console.error("Error uploading file:", error)
      }
    }
    toast({ title: "Arquivos enviados" })
  }

  const handleRemoveOsMedia = async (id: string) => {
    try {
      await deleteServiceMedia(id)
      setOsMedia(osMedia.filter(m => m.id !== id))
      toast({ title: "Arquivo removido" })
    } catch (error) {
      console.error("Error removing media:", error)
      toast({ title: "Erro ao remover arquivo", variant: "destructive" })
    }
  }

  const handleOsStatusChange = async (newStatus: string) => {
    setOsForm(prev => ({ ...prev, status: newStatus }))
    if (currentOsId) {
      try {
        const entry = await addTimelineEntry({
          service_order_id: currentOsId,
          action: `Status alterado para: ${newStatus}`,
          user_name: "Usuário",
          timestamp: new Date().toISOString()
        })
        setOsTimeline([...osTimeline, entry])
      } catch (error) {
        console.error("Error adding timeline entry:", error)
      }
    }
  }

  const initOsSignatureCanvas = () => {
    const canvas = osSignatureCanvasRef
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 2
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const startOsDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = osSignatureCanvasRef
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    let x, y
    if ("touches" in e) {
      x = (e.touches[0].clientX - rect.left) * scaleX
      y = (e.touches[0].clientY - rect.top) * scaleY
    } else {
      x = (e.clientX - rect.left) * scaleX
      y = (e.clientY - rect.top) * scaleY
    }
    setOsIsDrawing(true)
    setOsLastPosition({ x, y })
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(x, y)
    }
  }

  const drawOs = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!osIsDrawing) return
    const canvas = osSignatureCanvasRef
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    let x, y
    if ("touches" in e) {
      x = (e.touches[0].clientX - rect.left) * scaleX
      y = (e.touches[0].clientY - rect.top) * scaleY
    } else {
      x = (e.clientX - rect.left) * scaleX
      y = (e.clientY - rect.top) * scaleY
    }
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.lineTo(x, y)
      ctx.stroke()
    }
    setOsLastPosition({ x, y })
  }

  const stopOsDrawing = () => {
    setOsIsDrawing(false)
  }

  const clearOsSignature = () => {
    const canvas = osSignatureCanvasRef
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const saveOsSignature = async () => {
    const canvas = osSignatureCanvasRef
    if (!canvas || !osShowSignatureDialog) return
    const dataUrl = canvas.toDataURL("image/png")
    const res = await fetch(dataUrl)
    const blob = await res.blob()
    const file = new File([blob], `signature-${osShowSignatureDialog}.png`, { type: "image/png" })
    const url = await uploadImage(file)
    if (osShowSignatureDialog === "entrada") {
      setOsForm(prev => ({ ...prev, entry_signature: url }))
    } else {
      setOsForm(prev => ({ ...prev, exit_signature: url }))
    }
    setOsShowSignatureDialog(null)
    toast({ title: "Assinatura salva" })
  }

  const generateOsPdf = async () => {
    const element = osReceiptRef
    if (!element) return
    try {
      toast({ title: "Gerando PDF..." })
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      })
      const imgData = canvas.toDataURL("image/jpeg", 0.95)
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      pdf.addImage(
        imgData,
        "JPEG",
        (pdfWidth - imgWidth * ratio) / 2,
        8,
        imgWidth * ratio,
        imgHeight * ratio
      )
      pdf.save(`${osForm.number || "ordem-servico"}.pdf`)
      toast({ title: "PDF gerado com sucesso" })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({ title: "Erro ao gerar PDF", variant: "destructive" })
    }
  }

  const openNewOs = () => {
    setOsView("form")
    setCurrentOsId(null)
    setOsForm({
      number: "",
      client_id: "",
      entry_date: new Date().toISOString().split("T")[0],
      expected_delivery_date: "",
      technician: "",
      priority: "Normal",
      origin: "Loja",
      status: "Recebido",
      customer_defect: "",
      technical_diagnosis: "",
      service_executed: "",
      parts_value: 0,
      labor_value: 0,
      discount: 0,
      shipping_value: 0,
      total_value: 0,
      payment_method: "",
      installments: 1,
      payment_status: "",
      warranty: "",
      warranty_term: "",
      portal_token: generateUUID(),
      entry_signature: "",
      exit_signature: "",
    })
    setOsEquipment([])
    setOsParts([])
    setOsChecklists([])
    setOsTimeline([])
    setOsMedia([])
    setOsActiveTab("info")
  }

  const openOs = (id: string) => {
    setOsView("form")
    setCurrentOsId(id)
    loadOsData(id)
  }

  // Load service orders on mount
  useEffect(() => {
    if (activeTab === "os") {
      loadServiceOrders()
    }
  }, [activeTab])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-blue-100 rounded-full">
                <Lock className="w-12 h-12 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Sistema de Orçamentos</CardTitle>
            <CardDescription className="text-center text-base">
              Área restrita. Digite sua senha para acessar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="password">Senha de Administrador</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="text-lg"
                  />
                </div>
                <Button type="submit" className="w-full text-lg h-12">
                  <LogIn className="mr-2 h-5 w-5" /> Entrar no Sistema
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } bg-white shadow-lg transition-all duration-300 ease-in-out flex flex-col`}
      >
        {/* Header da Sidebar */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center gap-3">
                <img src={configuracoes.logo || "/LOGON.png"} alt="Logo" className="h-8 w-8" />
                <h1 className="font-bold text-lg text-gray-800">Sistema</h1>
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="h-8 w-8">
              {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              const isDisabled = item.disabled

              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start ${sidebarOpen ? "px-3" : "px-2"} ${
                    isDisabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={() => {
                    if (isDisabled) return
                    setActiveTab(item.id)
                  }}
                  disabled={isDisabled}
                >
                  <Icon className={`h-4 w-4 ${sidebarOpen ? "mr-3" : ""}`} />
                  {sidebarOpen && <span>{item.label}</span>}
                </Button>
              )
            })}
          </div>
        </nav>

        {/* Footer da Sidebar */}
        {sidebarOpen && (
          <div className="p-4 border-t">
            <div className="flex flex-col gap-2">
              <a
                href="https://www.youtube.com/@LFINFO_SJB"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
              >
                <Youtube className="h-4 w-4" />
                YouTube
              </a>
              <a
                href="https://www.instagram.com/lfinfo_sjb"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-pink-600 transition-colors"
              >
                <Instagram className="h-4 w-4" />
                Instagram
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white shadow-sm border-b p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">
              {menuItems.find((item) => item.id === activeTab)?.label || "Sistema de Orçamento"}
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{configuracoes.nomeEmpresa}</span>
              <span className="text-sm text-gray-600">WhatsApp: {configuracoes.whatsapp}</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">{renderContent()}</div>
      </div>
    </div>
  )
}
