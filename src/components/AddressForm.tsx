import React, { useState } from 'react';
import { FormInput, FormSelect, FormCEPInput } from '@/components/ui/FormComponents';
import { AddressData } from '@/hooks/useViaCEP';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, RotateCcw } from 'lucide-react';

interface AddressFormData extends AddressData {
  number: string;
  complement?: string;
}

interface AddressFormProps {
  initialData?: Partial<AddressFormData>;
  onAddressChange?: (address: AddressFormData) => void;
  title?: string;
  showCard?: boolean;
}

const brazilianStates = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
];

export const AddressForm: React.FC<AddressFormProps> = ({
  initialData,
  onAddressChange,
  title = 'Endereço',
  showCard = true,
}) => {
  const [addressData, setAddressData] = useState<AddressFormData>({
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    ...initialData,
  });

  const updateField = (field: keyof AddressFormData, value: string) => {
    const newData = { ...addressData, [field]: value };
    setAddressData(newData);
    onAddressChange?.(newData);
  };

  const handleAddressFound = (address: AddressData) => {
    const newData = {
      ...addressData,
      ...address,
      // Mantém o número e complemento se já preenchidos
      number: addressData.number,
      complement: addressData.complement,
    };
    setAddressData(newData);
    onAddressChange?.(newData);
  };

  const clearForm = () => {
    const emptyData: AddressFormData = {
      zipCode: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
    };
    setAddressData(emptyData);
    onAddressChange?.(emptyData);
  };

  const isFormFilled = Object.values(addressData).some(value => value && value.trim() !== '');

  const formContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Digite o CEP para preenchimento automático
          </span>
        </div>
        {isFormFilled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearForm}
            className="text-gray-600 hover:text-gray-800"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormCEPInput
          label="CEP"
          value={addressData.zipCode}
          onCEPChange={(cep) => updateField('zipCode', cep)}
          onAddressFound={handleAddressFound}
          required
        />

        <FormInput
          label="Número"
          value={addressData.number}
          onChange={(e) => updateField('number', e.target.value)}
          placeholder="123"
          required
        />
      </div>

      <FormInput
        label="Logradouro"
        value={addressData.street}
        onChange={(e) => updateField('street', e.target.value)}
        placeholder="Rua, Avenida, etc."
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="Bairro"
          value={addressData.neighborhood}
          onChange={(e) => updateField('neighborhood', e.target.value)}
          placeholder="Centro"
          required
        />

        <FormInput
          label="Complemento"
          value={addressData.complement || ''}
          onChange={(e) => updateField('complement', e.target.value)}
          placeholder="Apto 101, Bloco A, etc. (opcional)"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="Cidade"
          value={addressData.city}
          onChange={(e) => updateField('city', e.target.value)}
          placeholder="São Paulo"
          required
        />

        <FormSelect
          label="Estado"
          value={addressData.state}
          onChange={(e) => updateField('state', e.target.value)}
          options={brazilianStates}
          placeholder="Selecione o estado"
          required
        />
      </div>
    </div>
  );

  if (!showCard) {
    return formContent;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {formContent}
      </CardContent>
    </Card>
  );
};
