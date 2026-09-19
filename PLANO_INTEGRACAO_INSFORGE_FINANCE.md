# 🚀 PLANO DE EVOLUÇÃO DO FINANCE-AI COM INSFORGE BACKEND

---

## 📌 1. Visão Geral da Arquitetura
O **Finance-AI** (`http://192.168.131.200:3012`) é o dashboard financeiro inteligente da ZapTech. A integração com o novo **InsForge BaaS Agent-Native** transforma o sistema em uma plataforma autônoma de alta performance com custo zero de terceiros.

```
[ Finance-AI (Next.js - :3012) ]
        │
        ├── 🔐 Auth & RLS ────────► [ InsForge Auth / JWT (Porta 7130) ]
        ├── 🗄️ PostgreSQL Data ───► [ InsForge DB / PostgREST (Porta 7432 / 5430) ]
        ├── 📦 Anexos/Comprovantes ──► [ InsForge Storage S3 ]
        ├── ⚡ Webhooks & IA ──────► [ InsForge Deno Edge Functions (Porta 7133) ]
        └── 🤖 Automação Agent ──► [ Hermes Agent via MCP (17 Ferramentas InsForge) ]
```

---

## 💡 2. Oportunidades de Melhoria & Recursos

### 1️⃣ Autenticação & Gestão de Usuários Nativa (Substituindo Clerk)
- **Como funciona**: Troca de chamadas de terceiros (Clerk) por autenticação JWT assimétrica nativa do InsForge.
- **Benefício**: Zero latência externa, controle total dos dados cadastrais dos usuários e redução de custos.

### 2️⃣ Anexo de Comprovantes & Leitura de Boletos por OCR (InsForge Storage)
- **Como funciona**: Uso da ferramenta `mcp__insforge__create-bucket` para criar o bucket `comprovantes-financeiros`.
- **Fluxo**: Ao anexar a foto de um boleto/comprovante, a foto vai para o InsForge Storage e aciona uma Edge Function Deno com Tesseract/OCR para extrair automaticamente valor, vencimento e fornecedor.

### 3️⃣ Conciliação Financeira Automática & Webhooks (Deno Edge Functions)
- **Como funciona**: Criação de Edge Functions no InsForge (`mcp__insforge__create-function`) para receber webhooks do Asaas, banco central/Open Finance ou gateways.
- **Benefício**: Baixa automática de parcelas e conciliação de fluxo de caixa em tempo real.

### 4️⃣ Carga em Lote de Extratos CSV/OFX (InsForge Bulk-Upsert)
- **Como funciona**: Uso da ferramenta `mcp__insforge__bulk-upsert` para importar extratos bancários inteiros (Bradesco, Itaú, Nubank) em segundos sem travar a interface do usuário.

### 5️⃣ Consultas & Relatórios Autônomos via MCP pelo JARVIS
- **Como funciona**: O JARVIS acessa o InsForge MCP (`get-table-schema`, `run-raw-sql`) para gerar relatórios financeiros instantâneos por voz ou texto no Telegram (ex: *"JARVIS, qual foi nosso lucro líquido esta semana?"*).

---

## 🛠️ 3. Plano de Ação em 4 Etapas

| Etapa | Ação | Status |
| :--- | :--- | :--- |
| **Fase 1** | Mapeamento das tabelas (`transactions`, `categories`, `users`) e espelhamento das DDLs no InsForge Postgres | ⏳ Pronto para iniciar |
| **Fase 2** | Criação do Bucket `comprovantes-financeiros` no InsForge via MCP | ⏳ Pronto para iniciar |
| **Fase 3** | Criação da Edge Function Deno de Conciliação Financeira | ⏳ Pronto para iniciar |
| **Fase 4** | Ajuste dos componentes visuais (Trend Colors Emerald/Rose) e deploy do Next.js | ⏳ Pronto para iniciar |
