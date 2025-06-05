
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useFinance } from '@/hooks/useFinance';
import { useStores } from '@/hooks/useStores';
import { FinancialSummaryCards } from '@/components/FinancialSummaryCards';
import { CategoryManager } from '@/components/CategoryManager';
import { TransactionManager } from '@/components/TransactionManager';
import { FinancialCharts } from '@/components/FinancialCharts';
import { ExportReports } from '@/components/ExportReports';
import { StoreManager } from '@/components/StoreManager';
import { StoreClosingManager } from '@/components/StoreClosingManager';
import { PaymentMethodManager } from '@/components/PaymentMethodManager';
import { DREReport } from '@/components/DREReport';
import { StoreRanking } from '@/components/StoreRanking';
import { StoreGoals } from '@/components/StoreGoals';
import { FinancialInsights } from '@/components/FinancialInsights';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const {
    categories,
    transactions,
    summary,
    addCategory,
    updateCategory,
    deleteCategory,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    exportData,
  } = useFinance();

  const {
    stores,
    closings,
    paymentMethods,
    movementTypes,
    goals,
    addStore,
    updateStore,
    deleteStore,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    addMovementType,
    updateMovementType,
    deleteMovementType,
    addStoreClosing,
    updateClosing,
    deleteClosing,
    generateDRE,
    addGoal,
    updateGoal,
    deleteGoal,
    storeRankings, // Usar diretamente o valor memoizado
  } = useStores();
  
  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                💰 Sistema de Gestão Financeira
              </h1>
              <p className="text-gray-600 mt-1">
                Controle completo das finanças pessoais e empresariais
              </p>
            </div>
            <Button 
              onClick={() => {
                exportData();
                toast({
                  title: "Backup realizado",
                  description: "Seus dados foram exportados com sucesso!",
                });
              }}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
            >
              💾 Fazer Backup
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Financial Summary Cards */}
        <FinancialSummaryCards summary={summary} />

        {/* Tabs for different sections */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-8">
            <TabsTrigger value="overview" className="flex items-center gap-1 text-xs">
              📊 Visão Geral
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-1 text-xs">
              💳 Transações
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-1 text-xs">
              🏷️ Categorias
            </TabsTrigger>
            <TabsTrigger value="stores" className="flex items-center gap-1 text-xs">
              🏪 Lojas
            </TabsTrigger>
            <TabsTrigger value="closings" className="flex items-center gap-1 text-xs">
              📊 Fechamentos
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-1 text-xs">
              ⚙️ Configurações
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-1 text-xs">
              📋 DRE
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center gap-1 text-xs">
              🎯 Metas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <FinancialCharts transactions={transactions} />
            
            {/* Store Rankings */}
            <StoreRanking rankings={storeRankings} />
            
            {/* Financial Insights */}
            <FinancialInsights 
              stores={stores} 
              closings={closings} 
              transactions={transactions} 
            />
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md animate-fade-in">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">📈 Última Receita</h3>
                {transactions.filter(t => t.type === 'income').length > 0 ? (
                  <div>
                    <p className="text-green-600 font-bold text-xl">
                      +R$ {transactions.filter(t => t.type === 'income')
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
                        ?.amount.toFixed(2).replace('.', ',')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {transactions.filter(t => t.type === 'income')[0]?.description}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500">Nenhuma receita registrada</p>
                )}
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md animate-fade-in">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">🏪 Lojas Cadastradas</h3>
                <p className="text-blue-600 font-bold text-xl">{stores.length}</p>
                <p className="text-sm text-gray-500">
                  {closings.length} fechamentos registrados
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md animate-fade-in">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">🎯 Status Geral</h3>
                <p className="text-blue-600 font-bold text-xl">
                  {summary.balance >= 0 ? '✅' : '❌'} {summary.balance >= 0 ? 'Positivo' : 'Negativo'}
                </p>
                <p className="text-sm text-gray-500">
                  {summary.transactionCount} transações pessoais
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionManager
              transactions={transactions}
              categories={categories}
              onAddTransaction={addTransaction}
              onUpdateTransaction={updateTransaction}
              onDeleteTransaction={deleteTransaction}
            />
          </TabsContent>

          <TabsContent value="categories">
            <CategoryManager
              categories={categories}
              onAddCategory={addCategory}
              onDeleteCategory={deleteCategory}
            />
          </TabsContent>

          <TabsContent value="stores">
            <StoreManager
              stores={stores}
              onAddStore={addStore}
              onUpdateStore={updateStore}
              onDeleteStore={deleteStore}
            />
          </TabsContent>

          <TabsContent value="closings">
            <StoreClosingManager
              stores={stores}
              closings={closings}
              paymentMethods={paymentMethods}
              movementTypes={movementTypes}
              onAddClosing={addStoreClosing}
              onUpdateClosing={updateClosing}
              onDeleteClosing={deleteClosing}
            />
          </TabsContent>

          <TabsContent value="config">
            <PaymentMethodManager
              paymentMethods={paymentMethods}
              movementTypes={movementTypes}
              onAddPaymentMethod={addPaymentMethod}
              onDeletePaymentMethod={deletePaymentMethod}
              onAddMovementType={addMovementType}
              onDeleteMovementType={deleteMovementType}
            />
          </TabsContent>

          <TabsContent value="reports">
            <div className="space-y-6">
              <DREReport 
                onGenerateDRE={generateDRE} 
                stores={stores}
              />
              <ExportReports
                transactions={transactions}
                onExportData={exportData}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="goals">
            <StoreGoals
              stores={stores}
              goals={goals}
              closings={closings}
              onAddGoal={addGoal}
              onUpdateGoal={updateGoal}
              onDeleteGoal={deleteGoal}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600">
            <p>💰 Sistema completo de gestão financeira pessoal e empresarial</p>
            <p className="text-sm mt-2">
              {transactions.length} transações pessoais • {stores.length} lojas • {closings.length} fechamentos • {goals.length} metas
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
