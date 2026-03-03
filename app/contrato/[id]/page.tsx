"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { useData } from "@/hooks/use-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CheckCircle, Save, X } from "lucide-react"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"

export default function ContratoPage() {
  const { id } = useParams()
  const { getContractById, signContract, uploadImage, fetchSettings } = useData()
  const { toast } = useToast()
  
  const [contrato, setContrato] = useState<any>(null)
  const [assinaturaContratado, setAssinaturaContratado] = useState<string | null>(null)
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Canvas refs e states para assinatura
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (id) {
      loadContrato(id as string)
    }
  }, [id])

  const loadContrato = async (contractId: string) => {
    try {
      setLoading(true)
      const [contractData, settingsData] = await Promise.all([
        getContractById(contractId),
        fetchSettings()
      ])
      
      setContrato(contractData)
      if (settingsData) {
        setSettings(settingsData)
        if (settingsData.assinaturaContratado) {
          setAssinaturaContratado(settingsData.assinaturaContratado)
        }
      } 
    } catch (error) {
      console.error("Erro ao carregar contrato:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar o contrato.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Funções do canvas de assinatura (reutilizadas)
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
    // Prevent scrolling when touching the canvas
    if (e.type === 'touchstart') {
       document.body.style.overflow = 'hidden'
    }
    
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    setIsDrawing(true)
    const pos = getCanvasPosition(e)
    setLastPosition(pos)

    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.strokeStyle = "#000000"
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
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

  const stopDrawing = () => {
    setIsDrawing(false)
    document.body.style.overflow = 'auto'
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const handleSign = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Verificar se o canvas está vazio (simples verificação)
    const ctx = canvas.getContext("2d")
    const blank = document.createElement("canvas")
    blank.width = canvas.width
    blank.height = canvas.height
    if (canvas.toDataURL() === blank.toDataURL()) {
      toast({
        title: "Assinatura vazia",
        description: "Por favor, assine no campo indicado.",
        variant: "destructive"
      })
      return
    }

    try {
      setSaving(true)
      
      // Converter canvas para blob/file
      const dataUrl = canvas.toDataURL("image/png")
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      const file = new File([blob], `signature_${id}.png`, { type: "image/png" })

      // Upload da assinatura
      const signatureUrl = await uploadImage(file, 'images')
      if (!signatureUrl) throw new Error("Falha ao salvar imagem da assinatura")

      // Atualizar contrato
      await signContract(id as string, signatureUrl)

      toast({
        title: "Contrato Assinado",
        description: "Sua assinatura foi registrada com sucesso!",
      })
      
      // Recarregar contrato
      loadContrato(id as string)
      
    } catch (error) {
      console.error("Erro ao salvar assinatura:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar a assinatura.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const gerarPDFAssinado = async () => {
    const element = document.getElementById("contrato-publico")
    if (!element) return

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        scrollX: 0,
        scrollY: -window.scrollY,
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      const imgWidth = pageWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let position = 0
      let heightLeft = imgHeight

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST")
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST")
        heightLeft -= pageHeight
      }

      pdf.save(`Contrato_${contrato.numero || "assinado"}.pdf`)
    } catch (error) {
      console.error("Erro ao gerar PDF assinado:", error)
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o PDF do contrato assinado.",
        variant: "destructive",
      })
    }
  }

  const formatarMoeda = (valor: number, moeda: string) => {
    if (moeda === "BRL") {
      return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    } else {
      return valor.toLocaleString("en-US", { style: "currency", currency: "USD" })
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg text-gray-600">Carregando contrato...</span>
      </div>
    )
  }

  if (!contrato) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Contrato não encontrado</CardTitle>
            <CardDescription>O link pode estar inválido ou o contrato foi removido.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow border overflow-hidden relative" id="contrato-publico">
          {contrato.paidAt && (
            <img
              src="/pago.png"
              alt="Pago"
              className="pointer-events-none absolute right-6 top-24 w-40 opacity-80 rotate-12"
            />
          )}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-4">
              {settings?.logo ? (
                <img src={settings.logo} alt={settings?.nomeEmpresa || "Empresa"} className="h-12 w-auto rounded-sm" />
              ) : (
                <div className="text-xl font-bold text-slate-800">{settings?.nomeEmpresa || "Empresa"}</div>
              )}
              <div className="hidden md:block">
                <div className="text-sm text-slate-500">{settings?.slogan}</div>
                <div className="text-xs text-slate-400">WhatsApp: {settings?.whatsapp}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-md text-sm font-medium">
                <span>Contrato Nº {contrato.numero}</span>
                {contrato.status === "signed" && <CheckCircle className="w-4 h-4 text-emerald-400" />}
              </div>
              <div className="text-xs text-slate-400 mt-1">{contrato.data} • {contrato.hora}</div>
            </div>
          </div>
          <div className="p-8 md:p-12 font-serif text-slate-900">
            <div className="text-center mb-10">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-wide mb-1">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
              {contrato.titulo && <p className="text-slate-500">{contrato.titulo}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="rounded-lg border bg-slate-50 p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">CONTRATANTE</h3>
                <div className="space-y-1.5 text-sm">
                  <p><span className="font-medium">Nome:</span> {contrato.contratante.nome}</p>
                  <p><span className="font-medium">CPF/CNPJ:</span> {contrato.contratante.cpfCnpj}</p>
                  <p><span className="font-medium">Endereço:</span> {contrato.contratante.endereco}</p>
                </div>
              </div>
              <div className="rounded-lg border bg-slate-50 p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">CONTRATADO</h3>
                <div className="space-y-1.5 text-sm">
                  <p><span className="font-medium">Nome:</span> {contrato.contratado.nome}</p>
                  <p><span className="font-medium">CPF/CNPJ:</span> {contrato.contratado.cpfCnpj}</p>
                  <p><span className="font-medium">Endereço:</span> {contrato.contratado.endereco}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6 text-justify leading-relaxed">
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-2">CLÁUSULA 1ª - DO OBJETO</h3>
                <div className="rounded-lg border bg-white p-5">
                  <p>{contrato.objeto}</p>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-800 mb-2">CLÁUSULA 2ª - DO VALOR E PAGAMENTO</h3>
                <div className="rounded-lg border bg-white p-5 space-y-1.5">
                  <p>Valor total: <span className="font-bold">{formatarMoeda(contrato.valor, contrato.moeda)}</span></p>
                  <p>Forma de pagamento: {contrato.formaPagamento}</p>
                </div>
              </div>

              {contrato.prazoExecucao && (
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-2">CLÁUSULA 3ª - DO PRAZO</h3>
                  <div className="rounded-lg border bg-white p-5">
                    <p>Prazo de execução: {contrato.prazoExecucao}</p>
                  </div>
                </div>
              )}

              {contrato.clausulas && contrato.clausulas.length > 0 && (
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-2">CLÁUSULAS ESPECÍFICAS</h3>
                  <div className="rounded-lg border bg-white p-5">
                    <ul className="list-disc pl-5 space-y-2">
                      {contrato.clausulas.map((c: string, i: number) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="pt-8 mt-8 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="text-center">
                    <div className="h-20 flex items-end justify-center">
                      {assinaturaContratado ? (
                        <img src={assinaturaContratado} alt="Assinatura do Contratado" className="max-h-20 object-contain" />
                      ) : (
                        <div className="text-slate-400 italic mb-2">{contrato.contratado.nome}</div>
                      )}
                    </div>
                    <div className="border-t border-slate-300 pt-2">
                      <p className="font-bold">{contrato.contratado.nome}</p>
                      <p className="text-xs text-slate-500">CONTRATADO</p>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="h-20 flex items-end justify-center">
                      {contrato.clientSignature ? (
                        <img src={contrato.clientSignature} alt="Assinatura do Contratante" className="max-h-20 object-contain" />
                      ) : (
                        <div className="text-slate-400 italic mb-2">Aguardando assinatura...</div>
                      )}
                    </div>
                    <div className="border-t border-slate-300 pt-2">
                      <p className="font-bold">{contrato.contratante.nome}</p>
                      <p className="text-xs text-slate-500">CONTRATANTE</p>
                      {contrato.clientSignedAt && (
                        <p className="text-[11px] text-slate-400 mt-1">
                          Assinado em {new Date(contrato.clientSignedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 text-center text-xs text-slate-500 border-t pt-4">
              <div className="font-medium">{settings?.nomeEmpresa}</div>
              <div>WhatsApp: {settings?.whatsapp}</div>
            </div>
          </div>
        </div>

        {/* Área de Assinatura / Download */}
        {!contrato.clientSignature ? (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800">Assinatura do Contratante</CardTitle>
              <CardDescription>
                Por favor, assine no quadro abaixo para concordar com os termos deste contrato.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-1 bg-white w-full max-w-md">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={200}
                    className="w-full h-auto cursor-crosshair touch-none bg-white rounded"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                <div className="flex gap-4 w-full max-w-md">
                  <Button variant="outline" onClick={clearCanvas} className="flex-1" disabled={saving}>
                    <X className="mr-2 h-4 w-4" /> Limpar
                  </Button>
                  <Button onClick={handleSign} className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" /> Assinar Contrato
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardHeader>
              <CardTitle className="text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Contrato assinado
              </CardTitle>
              <CardDescription>
                Sua assinatura foi registrada. Você pode fazer o download do contrato assinado em PDF.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={gerarPDFAssinado} className="bg-emerald-600 hover:bg-emerald-700">
                Baixar PDF assinado
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
