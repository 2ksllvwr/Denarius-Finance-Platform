import { useState } from "react";
import { AuthScreen } from "@/components/AuthScreen";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Layout } from "@/components/Layout";
import { LockScreen } from "@/components/LockScreen";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { TransactionModal } from "@/components/TransactionModal";
import type { Page, Transaction } from "@/data/types";
import { useFinanceApp } from "@/hooks/useFinanceApp";
import { AccountsPage } from "@/pages/AccountsPage";
import { BillingPage } from "@/pages/BillingPage";
import { CategoriesPage } from "@/pages/CategoriesPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { InsightsPage } from "@/pages/InsightsPage";
import { MonthlyPage } from "@/pages/MonthlyPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { TransactionsPage } from "@/pages/TransactionsPage";
import { downloadCsv, exportPdf } from "@/utils/finance";

export default function App() {
  const finance = useFinanceApp();
  const [page, setPage] = useState<Page>("dashboard");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    tone?: "danger" | "default";
    onConfirm: () => Promise<void>;
  } | null>(null);

  const openNewTransaction = () => {
    setEditingTransaction(null);
    setModalOpen(true);
  };

  const askConfirm = (input: {
    title: string;
    message: string;
    confirmLabel?: string;
    tone?: "danger" | "default";
    onConfirm: () => Promise<void>;
  }) => setConfirmDialog(input);

  const runConfirmedAction = async () => {
    const action = confirmDialog?.onConfirm;
    setConfirmDialog(null);
    if (action) await action();
  };

  if (!finance.user) {
    return (
      <AuthScreen
        loading={finance.loading}
        error={finance.error}
        onLogin={finance.login}
        onRegister={finance.register}
        onRequestEmailCode={finance.requestEmailCode}
        onVerifyEmailCode={finance.verifyEmailCode}
        onResetPassword={finance.resetPassword}
      />
    );
  }

  if (finance.locked) {
    return (
      <LockScreen
        userName={finance.user.name}
        onUnlock={finance.unlockWithPin}
        onLogout={finance.logout}
      />
    );
  }

  if (!finance.settings.onboardingCompleted) {
    return (
      <OnboardingPage
        user={finance.user}
        currency={finance.settings.currency}
        onComplete={finance.completeOnboarding}
        onLogout={finance.logout}
      />
    );
  }

  return (
    <>
      <Layout
        page={page}
        user={finance.user}
        mode={finance.mode}
        notifications={finance.notifications}
        selectedMonth={finance.selectedMonth}
        selectedMonthLabel={finance.selectedMonthLabel}
        onPageChange={setPage}
        onMonthChange={finance.setSelectedMonth}
        onPreviousMonth={finance.goToPreviousMonth}
        onNextMonth={finance.goToNextMonth}
        onNewTransaction={openNewTransaction}
        onLogout={finance.logout}
        onMarkNotificationsRead={finance.markNotificationsRead}
        onClearNotifications={finance.clearNotifications}
      >
        {page === "dashboard" && (
          <DashboardPage
            stats={finance.stats}
            transactions={finance.monthTransactions}
            categories={finance.categories}
            monthly={finance.monthly}
            currency={finance.settings.currency}
            userName={finance.user.name}
            selectedMonthLabel={finance.selectedMonthLabel}
            onViewTransactions={() => setPage("transactions")}
            onNewTransaction={openNewTransaction}
          />
        )}

        {page === "insights" && (
          <InsightsPage
            transactions={finance.monthTransactions}
            accounts={finance.accounts}
            categories={finance.categories}
            stats={finance.stats}
            currency={finance.settings.currency}
            selectedMonthLabel={finance.selectedMonthLabel}
            onReviewTransactions={() => setPage("transactions")}
            onOpenAccounts={() => setPage("accounts")}
            onOpenBudgets={() => setPage("categories")}
          />
        )}

        {page === "transactions" && (
          <TransactionsPage
            transactions={finance.monthTransactions}
            accounts={finance.accounts}
            categories={finance.categories}
            currency={finance.settings.currency}
            selectedMonthLabel={finance.selectedMonthLabel}
            onImport={finance.importTransactions}
            onEdit={transaction => {
              setEditingTransaction(transaction);
              setModalOpen(true);
            }}
            onDuplicate={finance.duplicateTransaction}
            onToggleStatus={finance.toggleTransactionStatus}
            onDelete={async id => askConfirm({
              title: "Remover transacao",
              message: "Essa acao nao pode ser desfeita.",
              confirmLabel: "Remover",
              tone: "danger",
              onConfirm: () => finance.deleteTransaction(id),
            })}
            onNewTransaction={openNewTransaction}
          />
        )}

        {page === "monthly" && (
          <MonthlyPage
            stats={finance.stats}
            transactions={finance.monthTransactions}
            categories={finance.categories}
            recurringTransactions={finance.recurringTransactions}
            selectedMonth={finance.selectedMonth}
            selectedMonthLabel={finance.selectedMonthLabel}
            monthlyGoal={finance.selectedMonthlyGoal}
            monthlyClosure={finance.selectedMonthlyClosure}
            currency={finance.settings.currency}
            onSaveGoal={finance.saveMonthlyGoal}
            onCloseMonth={async notes => askConfirm({
              title: "Fechar mes",
              message: "O fechamento sera salvo com os valores atuais.",
              confirmLabel: "Fechar",
              onConfirm: () => finance.closeSelectedMonth(notes),
            })}
            onReopenMonth={async () => askConfirm({
              title: "Reabrir mes",
              message: "O mes voltara para edicao normal.",
              confirmLabel: "Reabrir",
              onConfirm: finance.reopenSelectedMonth,
            })}
            onAddRecurring={finance.addRecurringTransaction}
            onToggleRecurring={finance.toggleRecurringTransaction}
            onDeleteRecurring={async id => askConfirm({
              title: "Remover recorrencia",
              message: "Os lancamentos ja criados nao serao apagados.",
              confirmLabel: "Remover",
              tone: "danger",
              onConfirm: () => finance.deleteRecurringTransaction(id),
            })}
            onGenerateRecurring={finance.generateRecurringForSelectedMonth}
          />
        )}

        {page === "categories" && (
          <CategoriesPage
            categories={finance.categories}
            currency={finance.settings.currency}
            onAdd={finance.addCategory}
            onUpdate={finance.updateCategory}
            onDelete={async id => askConfirm({
              title: "Remover categoria",
              message: "As transacoes existentes continuam com o nome salvo.",
              confirmLabel: "Remover",
              tone: "danger",
              onConfirm: () => finance.deleteCategory(id),
            })}
          />
        )}

        {page === "accounts" && (
          <AccountsPage
            accounts={finance.accounts}
            transactions={finance.transactions}
            currency={finance.settings.currency}
            onAdd={finance.addAccount}
            onUpdate={finance.updateAccount}
            onDelete={async id => askConfirm({
              title: "Remover conta",
              message: "A conta saira do seu mapa financeiro.",
              confirmLabel: "Remover",
              tone: "danger",
              onConfirm: () => finance.deleteAccount(id),
            })}
          />
        )}

        {page === "billing" && (
          <BillingPage currentPlan={finance.user.plan} onChangePlan={finance.changePlan} />
        )}

        {page === "settings" && (
          <SettingsPage
            user={finance.user}
            settings={finance.settings}
            backupSnapshots={finance.backupSnapshots}
            deletedTransactions={finance.deletedTransactions}
            onSave={finance.saveSettings}
            onUpdateProfile={finance.updateProfile}
            onClear={async () => askConfirm({
              title: "Limpar dados",
              message: "Todas as transacoes deste perfil serao removidas. Essa acao nao pode ser desfeita.",
              confirmLabel: "Limpar",
              tone: "danger",
              onConfirm: finance.clearTransactions,
            })}
            onExportCsv={() => downloadCsv(finance.monthTransactions)}
            onExportPdf={() => exportPdf(finance.monthTransactions, finance.stats)}
            onExportBackup={finance.exportBackup}
            onImportBackup={async file => askConfirm({
              title: "Restaurar backup",
              message: "O backup vai substituir os dados atuais do perfil.",
              confirmLabel: "Restaurar",
              tone: "danger",
              onConfirm: () => finance.importBackup(file),
            })}
            onCreateSnapshot={finance.createManualSnapshot}
            onRestoreSnapshot={async id => askConfirm({
              title: "Restaurar snapshot",
              message: "O snapshot vai substituir os dados atuais.",
              confirmLabel: "Restaurar",
              tone: "danger",
              onConfirm: () => finance.restoreSnapshot(id),
            })}
            onRestoreTransaction={finance.restoreTransaction}
            onDeleteTransactionForever={async id => askConfirm({
              title: "Apagar definitivamente",
              message: "Essa transacao saira da lixeira e nao podera ser restaurada.",
              confirmLabel: "Apagar",
              tone: "danger",
              onConfirm: () => finance.deleteTransactionForever(id),
            })}
            onEmptyTrash={async () => askConfirm({
              title: "Esvaziar lixeira",
              message: "Todas as transacoes na lixeira serao apagadas definitivamente.",
              confirmLabel: "Esvaziar",
              tone: "danger",
              onConfirm: finance.emptyTrash,
            })}
            onSetPin={finance.setSecurityPin}
            onClearPin={finance.clearSecurityPin}
            onLock={finance.lockApp}
          />
        )}
      </Layout>

      <PwaInstallPrompt />
      <ConfirmDialog
        open={Boolean(confirmDialog)}
        title={confirmDialog?.title ?? ""}
        message={confirmDialog?.message ?? ""}
        confirmLabel={confirmDialog?.confirmLabel}
        tone={confirmDialog?.tone}
        onCancel={() => setConfirmDialog(null)}
        onConfirm={() => void runConfirmedAction()}
      />

      <TransactionModal
        open={modalOpen}
        accounts={finance.accounts}
        categories={finance.categories}
        transaction={editingTransaction}
        onClose={() => {
          setModalOpen(false);
          setEditingTransaction(null);
        }}
        onSubmit={async input => {
          if (editingTransaction) await finance.updateTransaction(editingTransaction.id, input);
          else await finance.addInstallmentTransaction(input);
        }}
      />
    </>
  );
}
