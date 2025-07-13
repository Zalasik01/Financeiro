import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface ViaCEPAddress {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export interface AddressData {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

interface UseViaCEPOptions {
  onAddressFound?: (address: AddressData) => void;
  showToast?: boolean;
}

export const useViaCEP = (options: UseViaCEPOptions = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { onAddressFound, showToast = true } = options;

  const formatCEP = (cep: string): string => {
    // Remove tudo que não é número
    const numbers = cep.replace(/\D/g, '');
    
    // Aplica a máscara XXXXX-XXX
    if (numbers.length <= 5) {
      return numbers;
    }
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const validateCEP = (cep: string): boolean => {
    const cleanCEP = cep.replace(/\D/g, '');
    return cleanCEP.length === 8 && /^[0-9]{8}$/.test(cleanCEP);
  };

  const searchAddress = useCallback(async (cep: string): Promise<AddressData | null> => {
    const cleanCEP = cep.replace(/\D/g, '');
    
    if (!validateCEP(cleanCEP)) {
      const errorMsg = 'CEP deve conter 8 dígitos';
      setError(errorMsg);
      if (showToast) {
        toast({
          title: 'CEP Inválido',
          description: errorMsg,
          variant: 'destructive',
        });
      }
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      
      if (!response.ok) {
        throw new Error('Erro na consulta do CEP');
      }

      const data: ViaCEPAddress = await response.json();

      if (data.erro) {
        throw new Error('CEP não encontrado');
      }

      const addressData: AddressData = {
        street: data.logradouro,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
        zipCode: formatCEP(data.cep),
      };

      if (onAddressFound) {
        onAddressFound(addressData);
      }

      if (showToast) {
        toast({
          title: 'Endereço encontrado',
          description: `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`,
          variant: 'success',
        });
      }

      return addressData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar CEP';
      setError(errorMessage);
      
      if (showToast) {
        toast({
          title: 'Erro ao buscar CEP',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [onAddressFound, showToast, toast]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    searchAddress,
    loading,
    error,
    clearError,
    formatCEP,
    validateCEP,
  };
};
