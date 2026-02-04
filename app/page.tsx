"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
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
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useData } from "@/hooks/use-data"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import { supabase } from "@/lib/supabase"

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
  const [cliente, setCliente] = useState<Cliente>({ nome: "", telefone: "" })
  const [itens, setItens] = useState<Item[]>([])
  const [itensSalvos, setItensSalvos] = useState<Item[]>([])
  const [itemSelecionado, setItemSelecionado] = useState<string>("")
  const [orcamentoGerado, setOrcamentoGerado] = useState<boolean>(false)
  const [numeroOrcamento, setNumeroOrcamento] = useState<string>("")
  const [dataOrcamento, setDataOrcamento] = useState<string>("")
  const [horaOrcamento, setHoraOrcamento] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("orcamento")
  const [historico, setHistorico] = useState<Orcamento[]>([])
  const [orcamentoSelecionado, setOrcamentoSelecionado] = useState<Orcamento | null>(null)
  const [filtroHistorico, setFiltroHistorico] = useState<string>("")
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true)
  const { toast } = useToast()
  const { 
    fetchProducts, saveProduct, deleteProduct,
    fetchClients, saveClient, deleteClient,
    fetchBudgets, saveBudget, deleteBudget,
    fetchContracts, saveContract, deleteContract,
    fetchTransactions, saveTransaction, deleteTransaction,
    fetchAccounts, saveAccount, deleteAccount,
    fetchSettings, saveSettings,
    uploadImage 
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
    { id: "clientes", label: "Cadastro de Clientes", icon: Users },
    { id: "carteira", label: "Carteira", icon: Wallet },
    { id: "historico", label: "Histórico", icon: History },
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
        if (accounts && accounts.length > 0) setContas(accounts)
        if (transactions && transactions.length > 0) setMovimentacoes(transactions)

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
      id: crypto.randomUUID(),
      ...novaMovimentacao,
      conta: contaSelecionada,
      dataHora: new Date().toLocaleString("pt-BR"),
    }

    try {
      await saveTransaction(movimentacao)
      
      const novasMovimentacoes = [movimentacao, ...movimentacoes]
      setMovimentacoes(novasMovimentacoes)
      
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

  const saveSignature = () => {
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

    const dataURL = canvas.toDataURL("image/png")
    setConfiguracoes({ ...configuracoes, assinaturaContratado: dataURL })

    toast({
      title: "Assinatura salva",
      description: "Sua assinatura foi salva com sucesso.",
    })
  }

  const adicionarItem = () => {
    setItens([...itens, { id: crypto.randomUUID(), descricao: "", valor: 0 }])
  }

  const adicionarItemSalvo = () => {
    if (!itemSelecionado) return

    const item = itensSalvos.find((item) => item.id === itemSelecionado)
    if (item) {
      setItens([...itens, { ...item, id: crypto.randomUUID() }])
      setItemSelecionado("")
    }
  }

  const removerItem = (id: string) => {
    // Verificar se não é o último item antes de remover
    if (itens.length > 1) {
      setItens(itens.filter((item) => item.id !== id))
    } else {
      // Se for o último item, limpar seus valores em vez de remover
      setItens([{ id: crypto.randomUUID(), descricao: "", valor: 0 }])
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
      id: crypto.randomUUID(),
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
    setItens([{ id: crypto.randomUUID(), descricao: "", valor: 0 }])
    setOrcamentoGerado(false)
    setActiveTab("orcamento")
  }

  const salvarConfiguracoes = async (novasConfiguracoes) => {
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
      id: crypto.randomUUID(),
      numero: novoNumeroContrato,
      data: dataFormatada,
      hora: horaFormatada,
    }

    try {
      await saveContract(novoContrato)

      const novoHistoricoContratos = [novoContrato, ...historicoContratos]
      setHistoricoContratos(novoHistoricoContratos)
      
      setContratoAtual({ ...contratoAtual, numero: novoNumeroContrato, data: dataFormatada, hora: horaFormatada })
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
          <div className="space-y-6">
            {/* Opções de Moeda e Idioma */}
            <Card>
              <CardHeader>
                <CardTitle>{traduzir("Configurações do Orçamento", "Budget Settings")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>{traduzir("Moeda", "Currency")}</Label>
                    <Select value={moedaOrcamento} onValueChange={(value: "BRL" | "USD") => setMoedaOrcamento(value)}>
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
                    <Label>{traduzir("Idioma", "Language")}</Label>
                    <Select value={idiomaOrcamento} onValueChange={(value: "pt" | "en") => setIdiomaOrcamento(value)}>
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

                {moedaOrcamento === "USD" && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                    <p className="text-sm text-blue-700">
                      {traduzir(
                        `Cotação atual: 1 USD = ${formatarValor(cotacaoUSD, "BRL")}`,
                        `Current rate: 1 USD = ${formatarValor(cotacaoUSD, "BRL")}`,
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{traduzir("Dados do Cliente", "Client Information")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label>Selecionar Cliente Cadastrado</Label>
                      <Select
                        onValueChange={(value) => {
                          const clienteSelecionado = clientes.find((c) => c.id === value)
                          if (clienteSelecionado) {
                            setCliente({ nome: clienteSelecionado.nome, telefone: clienteSelecionado.telefone })
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
                      <Label htmlFor="nome">{traduzir("Nome", "Name")}</Label>
                      <Input
                        id="nome"
                        placeholder={traduzir("Nome do cliente", "Client name")}
                        value={cliente.nome}
                        onChange={(e) => setCliente({ ...cliente, nome: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="telefone">{traduzir("Telefone", "Phone")}</Label>
                      <Input
                        id="telefone"
                        placeholder={idiomaOrcamento === "pt" ? "(00) 00000-0000" : "+1 (000) 000-0000"}
                        value={cliente.telefone}
                        onChange={(e) => setCliente({ ...cliente, telefone: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{traduzir("Itens Salvos", "Saved Items")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="flex gap-2">
                      <Select value={itemSelecionado} onValueChange={setItemSelecionado}>
                        <SelectTrigger>
                          <SelectValue placeholder={traduzir("Selecione um item salvo...", "Select a saved item...")} />
                        </SelectTrigger>
                        <SelectContent>
                          {itensSalvos.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.descricao} - {formatarMoedaOrcamento(item.valor)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={adicionarItemSalvo} disabled={!itemSelecionado} variant="secondary">
                        {traduzir("Usar", "Use")}
                      </Button>
                    </div>

                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{traduzir("Descrição", "Description")}</TableHead>
                            <TableHead>{traduzir("Valor", "Value")}</TableHead>
                            <TableHead className="w-[100px]">{traduzir("Ações", "Actions")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {itensSalvos.length > 0 ? (
                            itensSalvos.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>{item.descricao}</TableCell>
                                <TableCell>{formatarMoedaOrcamento(item.valor)}</TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="icon" onClick={() => removerItemSalvo(item.id)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                                {traduzir("Nenhum item salvo", "No saved items")}
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

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{traduzir("Itens do Orçamento", "Budget Items")}</CardTitle>
                <Button onClick={adicionarItem} size="sm" variant="outline">
                  <Plus className="mr-2 h-4 w-4" /> {traduzir("Adicionar Item", "Add Item")}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60%]">{traduzir("Descrição", "Description")}</TableHead>
                        <TableHead>
                          {traduzir("Valor", "Value")} ({moedaOrcamento})
                        </TableHead>
                        <TableHead className="w-[150px]">{traduzir("Ações", "Actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itens.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Input
                              placeholder={traduzir("Descrição do item", "Item description")}
                              value={item.descricao}
                              onChange={(e) => atualizarItem(item.id, "descricao", e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              placeholder="0,00"
                              value={item.valor || ""}
                              onChange={(e) => atualizarItem(item.id, "valor", Number.parseFloat(e.target.value) || 0)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => salvarItem(item)}
                                      disabled={!item.descricao || item.valor <= 0}
                                    >
                                      <Save className="h-4 w-4 text-green-500" />
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

                <div className="mt-6 flex flex-col items-end">
                  <div className="bg-muted p-4 rounded-md w-full md:w-1/3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-lg">{traduzir("Total:", "Total:")}</span>
                      <span className="text-xl font-bold text-blue-600">{formatarMoedaOrcamento(calcularTotal())}</span>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-4">
                    <Button variant="outline" onClick={limparFormulario}>
                      {traduzir("Limpar", "Clear")}
                    </Button>
                    <Button
                      onClick={gerarOrcamento}
                      disabled={
                        !cliente.nome ||
                        !cliente.telefone ||
                        itens.filter((i) => i.descricao && i.valor > 0).length === 0
                      }
                    >
                      {traduzir("Gerar Orçamento", "Generate Budget")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">Diagnóstico do Sistema</CardTitle>
                <CardDescription>Use esta ferramenta se estiver enfrentando problemas para salvar dados.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    try {
                      toast({ title: "Testando conexão...", description: "Iniciando teste de escrita..." })

                      const testId = crypto.randomUUID()
                      console.log("Tentando inserir cliente teste:", testId)

                      // 1. Insert
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

                      // 2. Select
                      const { data: selectData, error: selectError } = await supabase
                        .from("clients")
                        .select("*")
                        .eq("id", testId)
                        .single()

                      if (selectError) {
                        alert(`ERRO AO LER: ${JSON.stringify(selectError)}`)
                        throw selectError
                      }

                      // 3. Delete
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
                >
                  Testar Conexão e Gravação no Banco
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
                  className="bg-white p-8 rounded-lg border shadow-sm print:shadow-none print:border-none max-w-4xl mx-auto"
                  style={{ fontFamily: "Times New Roman, serif" }}
                >
                  <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                      <img
                        src={configuracoes.logo || "/LOGON.png"}
                        alt={configuracoes.nomeEmpresa}
                        className="h-20 w-auto"
                      />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">
                      {traduzirContrato("CONTRATO DE PRESTAÇÃO DE SERVIÇOS", "SERVICE AGREEMENT CONTRACT")}
                    </h1>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">
                      {traduzirContrato("DE TECNOLOGIA DA INFORMAÇÃO", "INFORMATION TECHNOLOGY SERVICES")}
                    </h2>
                    {contratoAtual.titulo && (
                      <h3 className="text-lg font-medium text-blue-600 mb-2">{contratoAtual.titulo}</h3>
                    )}
                    <p className="text-lg font-semibold text-blue-700">Contrato Nº {contratoAtual.numero}</p>
                    <p className="text-sm text-gray-600 mt-2">
                      {contratoAtual.data} - {contratoAtual.hora}
                    </p>
                  </div>

                  <div className="space-y-6 text-sm leading-relaxed text-justify">
                    <div className="mb-6">
                      <p className="mb-4 text-base">
                        Pelo presente instrumento particular de{" "}
                        <strong>CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TECNOLOGIA DA INFORMAÇÃO</strong>, as partes abaixo
                        qualificadas:
                      </p>

                      <div className="bg-gray-50 p-6 rounded-md mb-6 border-l-4 border-blue-500">
                        <h3 className="font-bold text-lg mb-3 text-blue-700">
                          {traduzirContrato("1. CONTRATANTE:", "1. CONTRACTOR:")}
                        </h3>
                        <div className="space-y-1">
                          <p>
                            <span className="font-semibold">Nome/Razão Social:</span> {contratoAtual.contratante.nome}
                          </p>
                          <p>
                            <span className="font-semibold">CPF/CNPJ:</span> {contratoAtual.contratante.cpfCnpj}
                          </p>
                          {contratoAtual.contratante.endereco && (
                            <p>
                              <span className="font-semibold">Endereço:</span> {contratoAtual.contratante.endereco}
                            </p>
                          )}
                          {contratoAtual.contratante.telefone && (
                            <p>
                              <span className="font-semibold">Telefone:</span>{" "}
                              {formatarTelefone(contratoAtual.contratante.telefone)}
                            </p>
                          )}
                          {contratoAtual.contratante.email && (
                            <p>
                              <span className="font-semibold">E-mail:</span> {contratoAtual.contratante.email}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="bg-gray-50 p-6 rounded-md mb-6 border-l-4 border-green-500">
                        <h3 className="font-bold text-lg mb-3 text-green-700">
                          {traduzirContrato("2. CONTRATADO:", "2. SERVICE PROVIDER:")}
                        </h3>
                        <div className="space-y-1">
                          <p>
                            <span className="font-semibold">Nome/Razão Social:</span> {contratoAtual.contratado.nome}
                          </p>
                          <p>
                            <span className="font-semibold">CPF/CNPJ:</span> {contratoAtual.contratado.cpfCnpj}
                          </p>
                          {contratoAtual.contratado.endereco && (
                            <p>
                              <span className="font-semibold">Endereço:</span> {contratoAtual.contratado.endereco}
                            </p>
                          )}
                          {contratoAtual.contratado.telefone && (
                            <p>
                              <span className="font-semibold">Telefone:</span>{" "}
                              {formatarTelefone(contratoAtual.contratado.telefone)}
                            </p>
                          )}
                          {contratoAtual.contratado.email && (
                            <p>
                              <span className="font-semibold">E-mail:</span> {contratoAtual.contratado.email}
                            </p>
                          )}
                        </div>
                      </div>

                      <p className="text-base">
                        Resolvem celebrar o presente contrato, mediante as seguintes cláusulas e condições:
                      </p>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="font-bold text-lg mb-4 text-blue-700">CLÁUSULA 1ª - DO OBJETO</h3>
                      <div className="bg-blue-50 p-4 rounded-md mb-4 border">
                        <p className="text-justify">{contratoAtual.objeto}</p>
                      </div>
                    </div>

                    {contratoAtual.valor > 0 && (
                      <div className="border-t pt-6">
                        <h3 className="font-bold text-lg mb-4 text-blue-700">
                          {traduzirContrato(
                            "CLÁUSULA 2ª - DO VALOR E FORMA DE PAGAMENTO",
                            "CLAUSE 2 - VALUE AND PAYMENT METHOD",
                          )}
                        </h3>
                        <p className="mb-2">
                          <strong>2.1 -</strong>{" "}
                          {traduzirContrato(
                            "O valor total dos serviços contratados é de",
                            "The total value of contracted services is",
                          )}{" "}
                          <span className="font-bold text-green-600">{formatarMoedaContrato(contratoAtual.valor)}</span>
                          .
                        </p>
                        {contratoAtual.formaPagamento && (
                          <p>
                            <strong>2.2 -</strong> {traduzirContrato("Forma de pagamento:", "Payment method:")}{" "}
                            {contratoAtual.formaPagamento === "total-antes"
                              ? traduzirContrato(
                                  "100% do valor total antes do início do serviço",
                                  "100% of total value before service starts",
                                )
                              : contratoAtual.formaPagamento === "total-depois"
                                ? traduzirContrato(
                                    "100% do valor total após a conclusão do serviço",
                                    "100% of total value after service completion",
                                  )
                                : contratoAtual.formaPagamento === "50-50"
                                  ? traduzirContrato(
                                      "50% antes do início e 50% após a conclusão do serviço",
                                      "50% before start and 50% after completion",
                                    )
                                  : contratoAtual.formaPagamento === "personalizado"
                                    ? traduzirContrato(
                                        "Conforme especificado nas cláusulas contratuais",
                                        "As specified in contract clauses",
                                      )
                                    : contratoAtual.formaPagamento}
                          </p>
                        )}
                      </div>
                    )}

                    {contratoAtual.prazoExecucao && (
                      <div className="border-t pt-6">
                        <h3 className="font-bold text-lg mb-4 text-blue-700">CLÁUSULA 3ª - DO PRAZO</h3>
                        <p>
                          <strong>3.1 -</strong> O prazo para execução dos serviços é de{" "}
                          <strong>{contratoAtual.prazoExecucao}</strong>, contado a partir da assinatura do presente
                          contrato.
                        </p>
                      </div>
                    )}

                    {contratoAtual.clausulas.length > 0 && (
                      <div className="border-t pt-6">
                        <h3 className="font-bold text-lg mb-4 text-blue-700">CLÁUSULAS ESPECÍFICAS</h3>
                        <div className="space-y-4">
                          {contratoAtual.clausulas.map((clausula, index) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-md border-l-4 border-yellow-400">
                              <p className="text-justify">
                                <strong>CLÁUSULA {index + 4}ª -</strong> {clausula}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t pt-6">
                      <h3 className="font-bold text-lg mb-4 text-blue-700">CLÁUSULA FINAL - DISPOSIÇÕES GERAIS</h3>
                      <div className="space-y-2">
                        <p>
                          <strong>1.</strong> Este contrato é regido pelas leis brasileiras.
                        </p>
                        <p>
                          <strong>2.</strong> Qualquer alteração deve ser formalizada por escrito.
                        </p>
                        <p>
                          <strong>3.</strong> Fica eleito o foro da comarca de domicílio do CONTRATANTE para dirimir
                          quaisquer questões oriundas do presente contrato.
                        </p>
                      </div>
                    </div>

                    <div className="mt-16 pt-8 border-t-2 border-gray-300">
                      <p className="text-center mb-8 text-base">
                        E por estarem assim justos e contratados, firmam o presente contrato em duas vias de igual teor
                        e forma, na presença das testemunhas abaixo assinadas.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-16">
                        <div className="text-center">
                          <div className="border-t-2 border-gray-400 pt-3 mx-4">
                            <p className="font-bold text-base">{contratoAtual.contratante.nome}</p>
                            <p className="text-xs text-gray-600 uppercase tracking-wide">CONTRATANTE</p>
                            <p className="text-xs text-gray-500">CPF/CNPJ: {contratoAtual.contratante.cpfCnpj}</p>
                          </div>
                        </div>
                        <div className="text-center">
                          {configuracoes.assinaturaContratado ? (
                            <div className="mb-2">
                              <img
                                src={configuracoes.assinaturaContratado || "/placeholder.svg"}
                                alt="Assinatura do Contratado"
                                className="h-16 w-auto mx-auto mb-2"
                              />
                            </div>
                          ) : null}
                          <div className="border-t-2 border-gray-400 pt-3 mx-4">
                            <p className="font-bold text-base">{contratoAtual.contratado.nome}</p>
                            <p className="text-xs text-gray-600 uppercase tracking-wide">CONTRATADO</p>
                            <p className="text-xs text-gray-500">CPF/CNPJ: {contratoAtual.contratado.cpfCnpj}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="text-center">
                          <div className="border-t border-gray-300 pt-2 mx-8">
                            <p className="text-xs text-gray-600 uppercase">TESTEMUNHA 1</p>
                            <p className="text-xs text-gray-500">Nome: _______________________</p>
                            <p className="text-xs text-gray-500">CPF: ________________________</p>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="border-t border-gray-300 pt-2 mx-8">
                            <p className="text-xs text-gray-600 uppercase">TESTEMUNHA 2</p>
                            <p className="text-xs text-gray-500">Nome: _______________________</p>
                            <p className="text-xs text-gray-500">CPF: ________________________</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 border-t pt-6 mt-12 text-center bg-gray-50 p-4 rounded">
                    <p className="font-semibold">{configuracoes.nomeEmpresa}</p>
                    <p>WhatsApp: {configuracoes.whatsapp}</p>
                    <p className="mt-2 text-gray-400">Documento gerado eletronicamente</p>
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
                          {filtrarContratos()
                            .slice(0, 5)
                            .map((contrato) => (
                              <TableRow key={contrato.id}>
                                <TableCell className="font-medium">{contrato.numero}</TableCell>
                                <TableCell>{contrato.contratante.nome}</TableCell>
                                <TableCell>{contrato.contratado.nome}</TableCell>
                                <TableCell>{contrato.data}</TableCell>
                                <TableCell>{contrato.valor > 0 ? formatarMoeda(contrato.valor) : "-"}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
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
                                    detalheConta?.saldo >= 0 ? "text-green-600" : "text-red-600"
                                  }}`}
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
                  onClick={() => !isDisabled && setActiveTab(item.id)}
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

  async function removerMovimentacao(id: string) {
    try {
      await deleteTransaction(id)
      const novasMovimentacoes = movimentacoes.filter((mov) => mov.id !== id)
      setMovimentacoes(novasMovimentacoes)
      
      toast({
        title: "Movimentação removida",
        description: "A movimentação foi removida com sucesso!",
      })
    } catch (error) {
      console.error("Erro ao remover movimentação:", error)
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover a movimentação. Tente novamente.",
        variant: "destructive",
      })
    }
  }
}
