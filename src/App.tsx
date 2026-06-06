import { useState } from "react";
import { AuthScreen } from "@/components/AuthScreen";
import { Layout } from "@/components/Layout";
import { TransactionModal } from "@/components/TransactionModal";
import type { Page } from "@/data/types";
import { useFinanceApp } from "@/hooks/useFinanceApp";
import { BillingPage } from "@/pages/BillingPage";
import { CategoriesPage } from "@/pages/CategoriesPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { MonthlyPage } from "@/pages/MonthlyPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { TransactionsPage } from "@/pages/TransactionsPage";
import { downloadCsv, exportPdf } from "@/utils/finance";

export default function App() {
  const finance = useFinanceApp();
  const [page, setPage] = useState<Page>("dashboard");
  const [modalOpen, setModalOpen] = useState(false);

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
        onNewTransaction={() => setModalOpen(true)}
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
            onSave={finance.saveSettings}
            onUpdateProfile={finance.updateProfile}
            onClear={finance.clearTransactions}
            onExportCsv={() => downloadCsv(finance.monthTransactions)}
            onExportPdf={() => exportPdf(finance.monthTransactions, finance.stats)}
          />
        )}
      </Layout>

      <TransactionModal
        open={modalOpen}
        categories={finance.categories}
        onClose={() => setModalOpen(false)}
        onSubmit={finance.addTransaction}
      />
    </>
  );
}
