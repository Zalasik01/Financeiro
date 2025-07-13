import React, { useState } from 'react';
import { AddressForm } from '@/components/AddressForm';
import { StoreFormWithAddress } from '@/components/StoreFormWithAddress';
import { FormCEPInput } from '@/components/ui/FormComponents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building, Search, CheckCircle } from 'lucide-react';
import { AddressData } from '@/hooks/useViaCEP';

export default function ViaCEPDemoPage() {
  const [simpleAddress, setSimpleAddress] = useState<AddressData | null>(null);
  const [formAddress, setFormAddress] = useState<any>(null);
  const [showStoreForm, setShowStoreForm] = useState(false);

  const handleSimpleAddressFound = (address: AddressData) => {
    setSimpleAddress(address);
  };

  const handleSaveStore = async (storeData: any) => {
    console.log('Salvando loja:', storeData);
    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    setShowStoreForm(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <MapPin className="h-8 w-8 text-blue-600" />
          Integração ViaCEP
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Demonstração da integração com a API ViaCEP para busca automática de endereços.
          Digite um CEP válido para ver a funcionalidade em ação.
        </p>
      </div>

      <Tabs defaultValue="simple" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="simple" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Busca Simples
          </TabsTrigger>
          <TabsTrigger value="form" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Formulário Completo
          </TabsTrigger>
          <TabsTrigger value="integrated" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Exemplo Integrado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="simple" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Busca Simples de CEP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-md">
                <FormCEPInput
                  label="CEP"
                  placeholder="Digite um CEP para testar"
                  onAddressFound={handleSimpleAddressFound}
                />
              </div>

              {simpleAddress && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h3 className="font-medium text-green-800">Endereço Encontrado</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium">CEP:</span> {simpleAddress.zipCode}
                    </div>
                    <div>
                      <span className="font-medium">Logradouro:</span> {simpleAddress.street}
                    </div>
                    <div>
                      <span className="font-medium">Bairro:</span> {simpleAddress.neighborhood}
                    </div>
                    <div>
                      <span className="font-medium">Cidade:</span> {simpleAddress.city}
                    </div>
                    <div>
                      <span className="font-medium">Estado:</span> {simpleAddress.state}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-medium">CEPs para teste:</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">01310-100 (Av. Paulista)</Badge>
                  <Badge variant="outline">20040-020 (Centro-RJ)</Badge>
                  <Badge variant="outline">30130-000 (Centro-BH)</Badge>
                  <Badge variant="outline">80010-000 (Centro-Curitiba)</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form" className="space-y-4">
          <AddressForm
            title="Formulário de Endereço Completo"
            onAddressChange={setFormAddress}
          />

          {formAddress && Object.values(formAddress).some(v => v) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Dados do Formulário
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
                  {JSON.stringify(formAddress, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="integrated" className="space-y-4">
          {!showStoreForm ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Exemplo: Cadastro de Loja
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Este exemplo mostra como integrar a busca de CEP em um formulário real de cadastro de loja.
                </p>
                <Button onClick={() => setShowStoreForm(true)}>
                  Abrir Formulário de Loja
                </Button>
              </CardContent>
            </Card>
          ) : (
            <StoreFormWithAddress
              onSave={handleSaveStore}
              onCancel={() => setShowStoreForm(false)}
            />
          )}
        </TabsContent>
      </Tabs>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-medium text-blue-800 mb-2">Recursos Implementados:</h3>
          <ul className="space-y-1 text-sm text-blue-700">
            <li>✅ Busca automática de endereço por CEP</li>
            <li>✅ Formatação automática do CEP (00000-000)</li>
            <li>✅ Validação de CEP em tempo real</li>
            <li>✅ Feedback visual de loading e erros</li>
            <li>✅ Preenchimento automático dos campos de endereço</li>
            <li>✅ Integração com sistema de validação Zod</li>
            <li>✅ Componentes reutilizáveis e customizáveis</li>
            <li>✅ Tratamento de erros da API ViaCEP</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
