import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export function useData() {
  const { toast } = useToast()
  
  // Products / Items
  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data.map((item: any) => ({
      id: item.id,
      descricao: item.description,
      valor: item.price
    }))
  }

  const saveProduct = async (product: any) => {
    const dbProduct = {
      id: product.id,
      description: product.descricao,
      price: product.valor
    }
    const { data, error } = await supabase.from('products').upsert(dbProduct).select().single()
    if (error) throw error
    return {
      id: data.id,
      descricao: data.description,
      valor: data.price
    }
  }

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw error
  }

  // Clients
  const fetchClients = async () => {
    const { data, error } = await supabase.from('clients').select('*').order('name')
    if (error) throw error
    return data.map((client: any) => ({
      id: client.id,
      nome: client.name,
      cpfCnpj: client.cpf_cnpj,
      endereco: client.address,
      telefone: client.phone,
      email: client.email
    }))
  }

  const saveClient = async (client: any) => {
    const dbClient = {
      id: client.id || undefined, // If empty string, send undefined to let Postgres generate UUID
      name: client.nome,
      cpf_cnpj: client.cpfCnpj,
      address: client.endereco,
      phone: client.telefone,
      email: client.email
    }
    
    // Remove id if it is undefined so upsert works for new items
    if (!dbClient.id) delete dbClient.id

    const { data, error } = await supabase.from('clients').upsert(dbClient).select().single()
    if (error) throw error
    return {
      id: data.id,
      nome: data.name,
      cpfCnpj: data.cpf_cnpj,
      endereco: data.address,
      telefone: data.phone,
      email: data.email
    }
  }

  const deleteClient = async (id: string) => {
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) throw error
  }

  // Budgets
  const fetchBudgets = async () => {
    const { data, error } = await supabase.from('budgets').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data.map((budget: any) => ({
      id: budget.id,
      numero: budget.number,
      cliente: budget.client_data,
      itens: budget.items,
      total: budget.total,
      data: budget.date,
      hora: budget.time,
      moeda: budget.currency,
      idioma: budget.language
    }))
  }

  const saveBudget = async (budget: any) => {
    // Map frontend camelCase to snake_case
    const dbBudget = {
      id: budget.id,
      number: budget.numero,
      client_data: budget.cliente,
      items: budget.itens,
      total: budget.total,
      date: budget.data,
      time: budget.hora,
      currency: budget.moeda,
      language: budget.idioma
    }

    const { data, error } = await supabase.from('budgets').upsert(dbBudget).select().single()
    if (error) throw error
    return {
      id: data.id,
      numero: data.number,
      cliente: data.client_data,
      itens: data.items,
      total: data.total,
      data: data.date,
      hora: data.time,
      moeda: data.currency,
      idioma: data.language
    }
  }

  const deleteBudget = async (id: string) => {
    const { error } = await supabase.from('budgets').delete().eq('id', id)
    if (error) throw error
  }

  // Contracts
  const fetchContracts = async () => {
    const { data, error } = await supabase.from('contracts').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data.map((contract: any) => ({
      id: contract.id,
      numero: contract.number,
      titulo: contract.title,
      contratante: contract.contractor_data,
      contratado: contract.hired_data,
      objeto: contract.object,
      valor: contract.value,
      prazoExecucao: contract.execution_term,
      formaPagamento: contract.payment_method,
      clausulas: contract.clauses,
      data: contract.date,
      hora: contract.time,
      moeda: contract.currency,
      idioma: contract.language,
      clientSignature: contract.client_signature,
      clientSignedAt: contract.client_signed_at,
      status: contract.status
    }))
  }

  const saveContract = async (contract: any) => {
     // Map frontend camelCase to snake_case
    const dbContract = {
      id: contract.id,
      number: contract.numero,
      title: contract.titulo,
      contractor_data: contract.contratante,
      hired_data: contract.contratado,
      object: contract.objeto,
      value: contract.valor,
      execution_term: contract.prazoExecucao,
      payment_method: contract.formaPagamento,
      clauses: contract.clausulas,
      date: contract.data,
      time: contract.hora,
      currency: contract.moeda || 'BRL',
      language: contract.idioma || 'pt',
      client_signature: contract.clientSignature,
      client_signed_at: contract.clientSignedAt,
      status: contract.status
    }

    const { data, error } = await supabase.from('contracts').upsert(dbContract).select().single()
    if (error) throw error
    return {
      id: data.id,
      numero: data.number,
      titulo: data.title,
      contratante: data.contractor_data,
      contratado: data.hired_data,
      objeto: data.object,
      valor: data.value,
      prazoExecucao: data.execution_term,
      formaPagamento: data.payment_method,
      clausulas: data.clauses,
      data: data.date,
      hora: data.time,
      moeda: data.currency,
      idioma: data.language,
      clientSignature: data.client_signature,
      clientSignedAt: data.client_signed_at,
      status: data.status
    }
  }

  const deleteContract = async (id: string) => {
    const { error } = await supabase.from('contracts').delete().eq('id', id)
    if (error) throw error
  }

  const getContractById = async (id: string) => {
    const { data, error } = await supabase.from('contracts').select('*').eq('id', id).single()
    if (error) throw error
    return {
      id: data.id,
      numero: data.number,
      titulo: data.title,
      contratante: data.contractor_data,
      contratado: data.hired_data,
      objeto: data.object,
      valor: data.value,
      prazoExecucao: data.execution_term,
      formaPagamento: data.payment_method,
      clausulas: data.clauses,
      data: data.date,
      hora: data.time,
      moeda: data.currency,
      idioma: data.language,
      clientSignature: data.client_signature,
      clientSignedAt: data.client_signed_at,
      status: data.status
    }
  }

  const signContract = async (id: string, signatureUrl: string) => {
    const { error } = await supabase.from('contracts').update({
      client_signature: signatureUrl,
      client_signed_at: new Date().toISOString(),
      status: 'signed'
    }).eq('id', id)
    
    if (error) throw error
  }

  // Wallet
  const fetchTransactions = async () => {
    const { data, error } = await supabase.from('wallet_transactions').select('*').order('date', { ascending: false })
    if (error) throw error
    return data.map((t: any) => ({
      id: t.id,
      tipo: t.type,
      titulo: t.title,
      observacao: t.observation,
      data: t.date,
      valor: t.value,
      formaPagamento: t.payment_method,
      motivo: t.reason,
      moeda: t.currency,
      conta: t.account
    }))
  }

  const saveTransaction = async (transaction: any) => {
    const dbTransaction = {
      id: transaction.id,
      type: transaction.tipo,
      title: transaction.titulo,
      observation: transaction.observacao,
      date: transaction.data, // Make sure format is compatible or use ISO string
      value: transaction.valor,
      payment_method: transaction.formaPagamento,
      reason: transaction.motivo,
      currency: transaction.moeda,
      account: transaction.conta
    }
    const { data, error } = await supabase.from('wallet_transactions').upsert(dbTransaction).select().single()
    if (error) throw error
    return {
      id: data.id,
      tipo: data.type,
      titulo: data.title,
      observacao: data.observation,
      data: data.date,
      valor: data.value,
      formaPagamento: data.payment_method,
      motivo: data.reason,
      moeda: data.currency,
      conta: data.account
    }
  }

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from('wallet_transactions').delete().eq('id', id)
    if (error) throw error
  }

  const fetchAccounts = async () => {
    const { data, error } = await supabase.from('wallet_accounts').select('*').order('created_at')
    if (error) throw error
    return data.map((a: any) => a.name) // Frontend expects just an array of strings
  }

  const saveAccount = async (name: string) => {
    const { data, error } = await supabase.from('wallet_accounts').insert({ name }).select().single()
    if (error) throw error
    return data.name
  }

  const deleteAccount = async (name: string) => {
    // Delete transactions first (manual cascade)
    const { error: transError } = await supabase.from('wallet_transactions').delete().eq('account', name)
    if (transError) throw transError

    const { error } = await supabase.from('wallet_accounts').delete().eq('name', name)
    if (error) throw error
  }

  // Settings
  const fetchSettings = async () => {
    const { data, error } = await supabase.from('settings').select('*').single()
    if (error && error.code !== 'PGRST116') throw error
    if (!data) return null
    return {
      nomeEmpresa: data.company_name,
      whatsapp: data.whatsapp,
      diasValidade: data.validity_days,
      logo: data.logo_url,
      slogan: data.slogan,
      assinaturaContratado: data.contractor_signature_url,
      dadosContratado: data.contractor_data
    }
  }

  const saveSettings = async (settings: any) => {
    const dbSettings = {
      company_name: settings.nomeEmpresa,
      whatsapp: settings.whatsapp,
      validity_days: settings.diasValidade,
      logo_url: settings.logo,
      slogan: settings.slogan,
      contractor_signature_url: settings.assinaturaContratado,
      contractor_data: settings.dadosContratado
    }
    
    // First check if settings exist to know if we need ID (though we probably only have 1 row)
    const { data: existing } = await supabase.from('settings').select('id').single()
    
    let result;
    if (existing) {
       result = await supabase.from('settings').update(dbSettings).eq('id', existing.id).select().single()
    } else {
       result = await supabase.from('settings').insert(dbSettings).select().single()
    }
    
    if (result.error) throw result.error
    const data = result.data
    return {
      nomeEmpresa: data.company_name,
      whatsapp: data.whatsapp,
      diasValidade: data.validity_days,
      logo: data.logo_url,
      slogan: data.slogan,
      dadosContratado: data.contractor_data
    }
  }

  // Image Upload
  const uploadImage = async (file: File, bucket: string = 'images') => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file)

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
    return data.publicUrl
  }

  return {
    fetchProducts,
    saveProduct,
    deleteProduct,
    fetchClients,
    saveClient,
    deleteClient,
    fetchBudgets,
    saveBudget,
    deleteBudget,
    fetchContracts,
    saveContract,
    deleteContract,
    getContractById,
    signContract,
    fetchTransactions,
    saveTransaction,
    deleteTransaction,
    fetchAccounts,
    saveAccount,
    deleteAccount,
    fetchSettings,
    saveSettings,
    uploadImage,
    supabase
  }
}
