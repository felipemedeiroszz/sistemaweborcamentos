-- Adicionar cláusula de inadimplência a todos os contratos existentes
-- Esta query adiciona a nova cláusula ao array JSON de cláusulas de cada contrato

UPDATE contracts 
SET clauses = clauses || '["DA INADIMPLÊNCIA: Em caso de inadimplência por período superior a 5 dias após o vencimento, o CONTRATADO poderá, mediante aviso prévio de 48 horas, suspender parcial ou totalmente os serviços prestados, incluindo suporte técnico, manutenção, integrações e demais funcionalidades sob sua responsabilidade. Caso o CONTRATADO seja responsável pela hospedagem, infraestrutura ou gerenciamento técnico do sistema, poderá ainda suspender o acesso ao sistema até a regularização dos pagamentos pendentes. O restabelecimento dos serviços ocorrerá após a confirmação do pagamento, podendo levar até 48 horas. O CONTRATANTE declara estar ciente de que a suspensão poderá impactar o funcionamento do sistema, não cabendo ao CONTRATADO qualquer responsabilidade por prejuízos decorrentes da inadimplência."]'::jsonb
WHERE clauses IS NOT NULL 
AND NOT (
  clauses::text LIKE '%DA INADIMPLÊNCIA%' OR 
  clauses::text LIKE '%inadimplência por período superior a 5 dias%'
);

-- Para contratos que não possuem cláusulas (campo NULL ou vazio), inicializa o array com a nova cláusula
UPDATE contracts 
SET clauses = '["DA INADIMPLÊNCIA: Em caso de inadimplência por período superior a 5 dias após o vencimento, o CONTRATADO poderá, mediante aviso prévio de 48 horas, suspender parcial ou totalmente os serviços prestados, incluindo suporte técnico, manutenção, integrações e demais funcionalidades sob sua responsabilidade. Caso o CONTRATADO seja responsável pela hospedagem, infraestrutura ou gerenciamento técnico do sistema, poderá ainda suspender o acesso ao sistema até a regularização dos pagamentos pendentes. O restabelecimento dos serviços ocorrerá após a confirmação do pagamento, podendo levar até 48 horas. O CONTRATANTE declara estar ciente de que a suspensão poderá impactar o funcionamento do sistema, não cabendo ao CONTRATADO qualquer responsabilidade por prejuízos decorrentes da inadimplência."]'::jsonb
WHERE clauses IS NULL OR jsonb_array_length(clauses) = 0;

-- Verificação: Mostrar quantos contratos foram atualizados
SELECT 
  COUNT(*) as total_contratos,
  COUNT(CASE WHEN clauses IS NOT NULL THEN 1 END) as contratos_com_clausulas,
  COUNT(CASE WHEN clauses::text LIKE '%DA INADIMPLÊNCIA%' THEN 1 END) as contratos_com_clausula_inadimplencia
FROM contracts;
