import React, { useState, useEffect } from 'react';
import { useFormValidation } from '@/hooks/useFormValidation';
import { storeSchema, StoreInput } from '@/utils/validation';
import { FormInput, FormErrors } from '@/components/ui/FormComponents';
import { AddressForm } from '@/components/AddressForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { maskCNPJ, onlyNumbers } from '@/utils/formatters';

interface StoreFormWithAddressProps {
  store?: StoreInput;
  onSave: (store: StoreInput) => Promise<void>;
  onCancel: () => void;
}

export const StoreFormWithAddress: React.FC<StoreFormWithAddressProps> = ({
  store,
  onSave,
  onCancel,
}) => {
  const { toast } = useToast();
  const [displayCNPJ, setDisplayCNPJ] = useState('');

  const {
    values,
    errors,
    isSubmitting,
    isValid,
    updateField,
    validateField,
    handleSubmit,
    getFieldError,
    setFieldValues,
  } = useFormValidation({
    schema: storeSchema,
    initialValues: store || {},
    onSubmit: async (data) => {
      try {
        await onSave(data);
        toast({
          title: 'Sucesso',
          description: store ? 'Loja atualizada!' : 'Loja criada!',
        });
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Falha ao salvar loja.',
          variant: 'destructive',
        });
        throw error;
      }
    },
  });

  // Atualiza o display do CNPJ quando o valor mudar
  useEffect(() => {
    if (values.cnpj) {
      setDisplayCNPJ(maskCNPJ(values.cnpj));
    }
  }, [values.cnpj]);

  // Inicializa o display do CNPJ se houver valor inicial
  useEffect(() => {
    if (store?.cnpj) {
      setDisplayCNPJ(maskCNPJ(store.cnpj));
    }
  }, [store?.cnpj]);

  const handleCNPJChange = (value: string) => {
    const cleanCNPJ = onlyNumbers(value);
    updateField('cnpj', cleanCNPJ);
    setDisplayCNPJ(maskCNPJ(cleanCNPJ));
  };

  const handleAddressChange = (addressData: any) => {
    setFieldValues({
      ...values,
      address: addressData,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {store ? 'Editar Loja' : 'Nova Loja'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormErrors errors={errors} />
            
            {/* Dados básicos da loja */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informações Básicas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Nome da Loja"
                  value={values.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                  onBlur={() => validateField('name')}
                  error={getFieldError('name')}
                  placeholder="Nome da loja"
                  required
                />

                <FormInput
                  label="CNPJ"
                  value={displayCNPJ}
                  onChange={(e) => handleCNPJChange(e.target.value)}
                  onBlur={() => validateField('cnpj')}
                  error={getFieldError('cnpj')}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
              </div>
            </div>

            {/* Formulário de endereço */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Endereço</h3>
              <AddressForm
                initialData={values.address}
                onAddressChange={handleAddressChange}
                showCard={false}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting || !isValid}
                className="flex-1"
              >
                {isSubmitting ? 'Salvando...' : store ? 'Atualizar' : 'Criar'}
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
        </CardContent>
      </Card>
    </div>
  );
};
