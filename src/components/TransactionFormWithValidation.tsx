import React from 'react';
import { useFormValidation } from '@/hooks/useFormValidation';
import { transactionSchema, TransactionInput } from '@/utils/validation';
import { FormInput, FormSelect, FormErrors } from '@/components/ui/FormComponents';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/CurrencyInput';
import { useAuth } from '@/hooks/useAuth';
import { useStores } from '@/hooks/useStores';
import { useFinance } from '@/hooks/useFinance';
import { useClientesFornecedores } from '@/hooks/useClientesFornecedores';
import { useToast } from '@/hooks/use-toast';
import { Transaction } from '@/types/finance';

interface TransactionFormWithValidationProps {
  transaction?: Transaction;
  onSave: (transaction: TransactionInput) => Promise<void>;
  onCancel: () => void;
}

export const TransactionFormWithValidation: React.FC<TransactionFormWithValidationProps> = ({
  transaction,
  onSave,
  onCancel,
}) => {
  const { user } = useAuth();
  const { stores } = useStores(user?.uid || '');
  const { categories, paymentMethods } = useFinance();
  const { clientesFornecedores } = useClientesFornecedores(user?.uid || '');
  const { toast } = useToast();

  const {
    values,
    errors,
    isSubmitting,
    isValid,
    updateField,
    validateField,
    handleSubmit,
    getFieldError,
  } = useFormValidation({
    schema: transactionSchema,
    initialValues: transaction ? {
      amount: transaction.valor,
      description: transaction.descricao,
      type: transaction.tipo as 'Receita' | 'Despesa',
      date: new Date(transaction.data),
      categoryId: transaction.categoriaId,
      storeId: transaction.lojaId,
      personId: transaction.pessoaId,
      paymentMethodId: transaction.formaPagamentoId,
    } : {
      type: 'Despesa' as const,
      date: new Date(),
    },
    onSubmit: async (data) => {
      try {
        await onSave(data);
        toast({
          title: 'Sucesso',
          description: transaction ? 'Transação atualizada!' : 'Transação criada!',
        });
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Falha ao salvar transação.',
          variant: 'destructive',
        });
        throw error;
      }
    },
  });

  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: cat.name,
  }));

  const storeOptions = stores.map(store => ({
    value: store.id,
    label: store.name,
  }));

  const paymentMethodOptions = paymentMethods.map(method => ({
    value: method.id,
    label: method.name,
  }));

  const personOptions = clientesFornecedores.map(person => ({
    value: person.id,
    label: person.name,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormErrors errors={errors} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormSelect
          label="Tipo"
          value={values.type || ''}
          onChange={(e) => updateField('type', e.target.value)}
          onBlur={() => validateField('type')}
          error={getFieldError('type')}
          options={[
            { value: 'Receita', label: 'Receita' },
            { value: 'Despesa', label: 'Despesa' },
          ]}
          required
        />

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Valor <span className="text-red-500">*</span>
          </label>
          <CurrencyInput
            value={values.amount || 0}
            onValueChange={(value) => updateField('amount', value)}
            onBlur={() => validateField('amount')}
            className={getFieldError('amount') ? 'border-red-500' : ''}
          />
          {getFieldError('amount') && (
            <p className="text-sm text-red-500">{getFieldError('amount')}</p>
          )}
        </div>
      </div>

      <FormInput
        label="Descrição"
        value={values.description || ''}
        onChange={(e) => updateField('description', e.target.value)}
        onBlur={() => validateField('description')}
        error={getFieldError('description')}
        placeholder="Descrição da transação"
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="Data"
          type="date"
          value={values.date ? values.date.toISOString().split('T')[0] : ''}
          onChange={(e) => updateField('date', new Date(e.target.value))}
          onBlur={() => validateField('date')}
          error={getFieldError('date')}
          required
        />

        <FormSelect
          label="Categoria"
          value={values.categoryId || ''}
          onChange={(e) => updateField('categoryId', e.target.value)}
          onBlur={() => validateField('categoryId')}
          error={getFieldError('categoryId')}
          options={categoryOptions}
          placeholder="Selecione uma categoria"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormSelect
          label="Loja"
          value={values.storeId || ''}
          onChange={(e) => updateField('storeId', e.target.value)}
          onBlur={() => validateField('storeId')}
          error={getFieldError('storeId')}
          options={storeOptions}
          placeholder="Selecione uma loja (opcional)"
        />

        <FormSelect
          label="Forma de Pagamento"
          value={values.paymentMethodId || ''}
          onChange={(e) => updateField('paymentMethodId', e.target.value)}
          onBlur={() => validateField('paymentMethodId')}
          error={getFieldError('paymentMethodId')}
          options={paymentMethodOptions}
          placeholder="Selecione uma forma (opcional)"
        />
      </div>

      <FormSelect
        label="Cliente/Fornecedor"
        value={values.personId || ''}
        onChange={(e) => updateField('personId', e.target.value)}
        onBlur={() => validateField('personId')}
        error={getFieldError('personId')}
        options={personOptions}
        placeholder="Selecione uma pessoa (opcional)"
      />

      <div className="flex gap-2 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting || !isValid}
          className="flex-1"
        >
          {isSubmitting ? 'Salvando...' : transaction ? 'Atualizar' : 'Criar'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
};
