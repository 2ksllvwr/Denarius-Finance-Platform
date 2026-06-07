# DENARIUS

DENARIUS Finance Platform é uma aplicação financeira offline-first com experiência de SaaS: login próprio, dashboard financeiro, organização mensal, metas, recorrências, backup local, PIN de segurança, PWA instalável e API Express/MongoDB preparada para produção.

![Dashboard do DENARIUS](docs/screenshots/dashboard.svg)

![Organização mensal do DENARIUS](docs/screenshots/monthly.svg)

## Destaques

- Autenticação local com cadastro, login, hash de senha e isolamento por usuário.
- Onboarding pós-cadastro para moeda, meta de saldo, limite de gastos e prioridade mensal.
- Dashboard com gráficos Recharts para receitas, despesas e distribuição por categoria.
- Seção mensal para metas, limite de gastos, fechamento/reabertura do mês e recorrências.
- Transações com criação, edição, duplicação, remoção, alternância de status e filtros avançados.
- Importação CSV, exportação CSV, relatório PDF e backup/restauração JSON completo.
- Snapshots locais recentes para restaurar estados anteriores.
- PIN local, bloqueio manual e bloqueio automático por inatividade.
- Perfil com foto, cargo, telefone, bio e preferências.
- Notificações internas em tempo real, com suporte a alertas do navegador.
- Sidebar responsiva com menu hamburger, animação suave e recolhimento ao clicar fora.
- PWA básico com manifest, service worker e shell offline.
- Backend Express com rotas protegidas, models Mongoose e endpoints para mensal/recorrências.
- Testes unitários para cálculos, CSV e backup.

## Stack

- React 19
- Vite 7
- TypeScript
- Tailwind CSS 4
- Recharts
- Vitest
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
npm run test         # testes unitários
npm run build        # build de produção
npm run preview      # preview do build
npm run audit        # auditoria de dependências
```

## Estrutura

```text
src/
  components/        componentes reutilizáveis, layout, marca, bloqueio e modal
  data/              tipos, dados iniciais e formatadores
  hooks/             estado principal do app financeiro
  pages/             dashboard, onboarding, mensal, transações, categorias, planos e ajustes
  utils/             autenticação local, backup, CSV, storage, segurança e cálculos
server/
  config/            ambiente e conexão MongoDB
  middleware/        autenticação JWT
  models/            models Mongoose
  routes/            rotas REST
  utils/             defaults e serializers
docs/
  screenshots/       imagens SVG para README/portfólio
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

### Mensal

- `GET /api/monthly`
- `PUT /api/monthly/goals/:month`
- `PUT /api/monthly/closures/:month`
- `DELETE /api/monthly/closures/:month`

### Recorrências

- `GET /api/recurring`
- `POST /api/recurring`
- `PATCH /api/recurring/:id`
- `DELETE /api/recurring/:id`

### Categorias

- `GET /api/categories`
- `POST /api/categories`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`

### Configurações

- `GET /api/settings`
- `PATCH /api/settings`

### Resumo, exportação e planos

- `GET /api/summary`
- `GET /api/export/csv`
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

## Backup e segurança

- Use **Backup JSON** em Ajustes para exportar conta, perfil, transações, categorias, metas, fechamentos e recorrências.
- Use **Restaurar JSON** para recuperar um backup no perfil atual.
- Use **Criar snapshot** para salvar cópias locais rápidas no navegador.
- Ative **PIN local** para bloquear a sessão por inatividade ou manualmente.

## Observações importantes

- O app offline depende do `localStorage`; limpar dados do navegador apaga contas e lançamentos locais sem backup.
- O `.env` não deve ser versionado.
- A API precisa de `MONGODB_URI` e `JWT_SECRET` para iniciar.
- A geração de PDF usa a janela de impressão do navegador.
- O checkout de assinatura ainda é placeholder para integração futura.

## Próximos passos recomendados

- Migrar dados offline para IndexedDB para armazenar bases maiores.
- Criar sincronização offline-first entre localStorage/IndexedDB e MongoDB.
- Adicionar testes de componentes e fluxos com Playwright.
- Criar instalador desktop com Electron ou Tauri.
- Conectar gateway de pagamento para planos.

## Licença

Projeto privado em desenvolvimento.
