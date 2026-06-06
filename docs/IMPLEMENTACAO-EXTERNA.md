# Guia de implementação externa do DENARIUS

Este app já funciona offline com dados salvos no `localStorage` do navegador. As etapas abaixo são para transformar a base em um produto com banco real, instalador, sincronização e notificações fora da aba.

## 1. Interligar banco de dados real

O backend Express e os models Mongoose já existem em `server/`. Para ligar com MongoDB:

1. Crie um banco no MongoDB Atlas ou rode MongoDB local.
2. Copie `.env.example` para `.env`.
3. Preencha:

```env
MONGODB_URI=mongodb+srv://USUARIO:SENHA@cluster0.xxxxx.mongodb.net/denarius?retryWrites=true&w=majority
JWT_SECRET=troque-por-uma-chave-longa-e-segura
PORT=3333
CLIENT_URL=http://localhost:5173
VITE_API_URL=http://localhost:3333/api
```

4. Rode `npm run dev:full`.
5. Troque o modo offline do frontend para chamadas reais da API em `src/hooks/useFinanceApp.ts`.

Sugestão de migração: manter o modo offline como fallback e criar um botão "Sincronizar" que envie `transactions`, `categories`, `settings`, `monthlyGoals`, `monthlyClosures` e `recurringTransactions` para rotas novas no backend.

## 2. Criar models e rotas que ainda faltam

Hoje o backend já tem usuário, transações, categorias e configurações. Para refletir as novas melhorias no banco, crie:

- `server/models/MonthlyGoal.ts`
- `server/models/MonthlyClosure.ts`
- `server/models/RecurringTransaction.ts`
- `server/routes/monthly.ts`
- `server/routes/recurring.ts`

Campos mínimos:

```ts
userId, month, savingsTarget, spendingLimit, notes, updatedAt
userId, month, closedAt, income, expense, balance, pending, transactionCount, notes
userId, description, amount, type, category, dayOfMonth, status, active, lastGeneratedMonth
```

Depois registre as rotas em `server/index.ts` usando o middleware de autenticação.

## 3. Gerar executável

Para transformar em app instalável no Windows, use Electron ou Tauri.

Opção mais direta com Electron:

```bash
npm install -D electron electron-builder
```

Crie um arquivo `electron/main.cjs` que abra o build do Vite. Depois adicione scripts no `package.json`:

```json
{
  "scripts": {
    "desktop:dev": "npm run build && electron .",
    "desktop:build": "npm run build && electron-builder"
  }
}
```

Para um app menor e mais moderno, Tauri é uma boa alternativa, mas exige Rust instalado.

## 4. Notificações realmente em tempo real

As notificações atuais são em tempo real dentro do app e podem usar permissão do navegador quando a aba está em segundo plano. Para notificações vindas do servidor:

- Use WebSocket ou Server-Sent Events no backend.
- Salve notificações em uma collection por usuário.
- Envie eventos quando orçamento passar de limite, recorrência for gerada, mês for fechado ou houver sincronização.
- Para push fora do navegador aberto, implemente Service Worker + Web Push.

## 5. Fonte Romanus e logo

O `D` atual foi estilizado via fonte serifada do sistema. Para usar exatamente a fonte Romanus:

1. Baixe a fonte com licença permitida para o uso desejado.
2. Coloque o arquivo em `src/assets/fonts/romanus.ttf`.
3. Adicione em `src/index.css`:

```css
@font-face {
  font-family: "Romanus";
  src: url("./assets/fonts/romanus.ttf") format("truetype");
  font-display: swap;
}
```

4. Troque o `fontFamily` do `BrandMark` em `src/components/Brand.tsx` para `"Romanus", Georgia, serif`.

## 6. Backup e segurança

Antes de produção:

- Troque `localStorage` por IndexedDB para dados offline maiores.
- Criptografe backups exportados.
- Use refresh token seguro no backend.
- Faça hash de senha somente no servidor.
- Nunca publique `.env`.
- Adicione exportação/importação completa em JSON para restaurar uma conta offline.

## Checklist de produção

- Banco configurado e testado.
- Rotas novas de mensal e recorrências implementadas.
- Frontend alternando entre offline e API.
- Build web rodando com `npm run build`.
- Instalador gerado com Electron/Tauri.
- Backup/exportação testados.
- Política de privacidade criada para dados financeiros.
