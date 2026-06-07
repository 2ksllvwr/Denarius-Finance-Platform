import { useState } from "react";
import { AuthScreen } from "@/components/AuthScreen";
import { Layout } from "@/components/Layout";
import { LockScreen } from "@/components/LockScreen";
import { TransactionModal } from "@/components/TransactionModal";
import type { Page, Transaction } from "@/data/types";
import { useFinanceApp } from "@/hooks/useFinanceApp";
import { BillingPage } from "@/pages/BillingPage";
import { CategoriesPage } from "@/pages/CategoriesPage";
import { DashboardPage } from "@/pages/DashboardPage";
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

  if (!finance.user) {
    return (
      <AuthScreen
        loading={finance.loading}
        error={finance.error}
        onLogin={finance.login}
        onRegister={finance.register}
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
        onNewTransaction={() => {
          setEditingTransaction(null);
          setModalOpen(true);
        }}
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
            selectedMonthLabel={finance.selectedMonthLabel}
            onViewTransactions={() => setPage("transactions")}
          />
        )}

        {page === "transactions" && (
          <TransactionsPage
            transactions={finance.monthTransactions}
            stats={finance.stats}
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
            onDelete={finance.deleteTransaction}
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
            onCloseMonth={finance.closeSelectedMonth}
            onReopenMonth={finance.reopenSelectedMonth}
            onAddRecurring={finance.addRecurringTransaction}
            onToggleRecurring={finance.toggleRecurringTransaction}
            onDeleteRecurring={finance.deleteRecurringTransaction}
            onGenerateRecurring={finance.generateRecurringForSelectedMonth}
          />
        )}

        {page === "categories" && (
          <CategoriesPage
            categories={finance.categories}
            currency={finance.settings.currency}
            onAdd={finance.addCategory}
            onUpdate={finance.updateCategory}
            onDelete={finance.deleteCategory}
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
            onSave={finance.saveSettings}
            onUpdateProfile={finance.updateProfile}
            onClear={finance.clearTransactions}
            onExportCsv={() => downloadCsv(finance.monthTransactions)}
            onExportPdf={() => exportPdf(finance.monthTransactions, finance.stats)}
            onExportBackup={finance.exportBackup}
            onImportBackup={finance.importBackup}
            onCreateSnapshot={finance.createManualSnapshot}
            onRestoreSnapshot={finance.restoreSnapshot}
            onSetPin={finance.setSecurityPin}
            onClearPin={finance.clearSecurityPin}
            onLock={finance.lockApp}
          />
        )}
      </Layout>

      <TransactionModal
        open={modalOpen}
        categories={finance.categories}
        transaction={editingTransaction}
        onClose={() => {
          setModalOpen(false);
          setEditingTransaction(null);
        }}
        onSubmit={async input => {
          if (editingTransaction) await finance.updateTransaction(editingTransaction.id, input);
          else await finance.addTransaction(input);
        }}
      />
    </>
  );
}
