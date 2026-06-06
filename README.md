# DENARIUS

DENARIUS é um aplicativo financeiro pessoal com experiência de SaaS: login próprio, uso offline, organização mensal, metas, recorrências, categorias com orçamento, notificações internas e exportação de dados.

O projeto combina um front-end React/Vite pronto para uso offline com um backend Express/MongoDB preparado para produção. Hoje, o fluxo principal funciona localmente pelo navegador; a integração com banco real está documentada em [docs/IMPLEMENTACAO-EXTERNA.md](docs/IMPLEMENTACAO-EXTERNA.md).

## Destaques

- Autenticação local com cadastro, login, hash de senha e isolamento por usuário.
- Dashboard financeiro com saldo, receitas, despesas, pendências e histórico mensal.
- Seção mensal para metas, limite de gastos, fechamento/reabertura do mês e recorrências.
- Transações com filtros por tipo, status, categoria, busca e faixa de valor.
- Importação CSV, exportação CSV e relatório PDF via impressão do navegador.
- Categorias com orçamento mensal e cálculo automático de gasto.
- Perfil com foto, cargo, telefone, bio e preferências.
- Notificações internas em tempo real, com suporte a alertas do navegador.
- Sidebar responsiva com menu hamburger, animação suave e recolhimento ao clicar fora.
- Backend Express com rotas protegidas e models Mongoose para evolução com MongoDB.

## Stack

- React 19
- Vite 7
- TypeScript
- Tailwind CSS 4
- Express 5
- MongoDB/Mongoose
- Zod
- JWT

## Requisitos

- Node.js 22 ou superior
- npm
- MongoDB local ou MongoDB Atlas, apenas se quiser usar a API com banco real

## Rodando em modo offline

O modo offline é o caminho mais simples para testar agora. Ele usa `localStorage` do navegador por usuário.

```bash
npm install
npm run dev
```

Abra:

```text
http://localhost:5173
```

Crie uma conta na tela inicial e use o app normalmente. Os dados ficam salvos no navegador, separados por origem. Por exemplo, `localhost:5173` e `127.0.0.1:5173` guardam dados diferentes.

## Rodando com API

Crie o `.env` a partir do exemplo:

```bash
cp .env.example .env
```

Preencha:

```env
VITE_API_URL=http://localhost:3333/api
PORT=3333
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb+srv://USUARIO:SENHA@cluster0.xxxxx.mongodb.net/denarius?retryWrites=true&w=majority
JWT_SECRET=troque-essa-chave-por-uma-chave-grande-e-segura
JWT_EXPIRES_IN=7d
```

Depois rode:

```bash
npm run dev:full
```

## Scripts

```bash
npm run dev          # front-end Vite
npm run dev:server   # API Express em modo watch
npm run dev:full     # front-end + API
npm run typecheck    # checagem TypeScript
npm run build        # build de produção
npm run preview      # preview do build
npm run audit        # auditoria de dependências
```

## Estrutura

```text
src/
  components/        componentes reutilizáveis, layout, marca e modal
  data/              tipos, dados iniciais e formatadores
  hooks/             estado principal do app financeiro
  pages/             dashboard, mensal, transações, categorias, planos e ajustes
  utils/             autenticação local, storage e cálculos financeiros
server/
  config/            ambiente e conexão MongoDB
  middleware/        autenticação JWT
  models/            models Mongoose
  routes/            rotas REST
  utils/             defaults e serializers
docs/
  IMPLEMENTACAO-EXTERNA.md
```

## Rotas da API

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Transações

- `GET /api/transactions`
- `POST /api/transactions`
- `DELETE /api/transactions/:id`
- `DELETE /api/transactions`

### Categorias

- `GET /api/categories`
- `POST /api/categories`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`

### Configurações

- `GET /api/settings`
- `PATCH /api/settings`

### Resumo

- `GET /api/summary`

### Exportação

- `GET /api/export/csv`

### Planos

- `GET /api/billing/plans`
- `PATCH /api/billing/plan`
- `POST /api/billing/checkout`

## Importação CSV

A tela de transações aceita CSV com separador `;` ou `,`.

Cabeçalhos recomendados:

```csv
data;descricao;tipo;categoria;status;valor
2026-06-05;Salário;receita;Trabalho;concluida;8500,00
2026-06-06;Mercado;despesa;Alimentação;concluida;230,50
```

Também são aceitos termos em inglês como `income`, `expense`, `completed` e `pending`.

## Observações importantes

- O app offline depende do `localStorage`; limpar dados do navegador apaga contas e lançamentos locais.
- O `.env` não deve ser versionado.
- A API precisa de `MONGODB_URI` e `JWT_SECRET` para iniciar.
- A geração de PDF usa a janela de impressão do navegador.
- Checkout, push externo e sincronização completa estão preparados como próximos passos, mas não conectados.

## Próximos passos recomendados

- Migrar dados offline para IndexedDB com backup JSON.
- Implementar rotas de metas mensais, fechamentos e recorrências no backend.
- Adicionar sincronização offline-first com resolução de conflitos.
- Criar instalador com Electron ou Tauri.
- Conectar gateway de pagamento para planos.
- Adicionar testes automatizados para autenticação, importação CSV e fechamento mensal.

## Licença

Projeto privado em desenvolvimento.
