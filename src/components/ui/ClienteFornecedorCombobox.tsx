import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ClienteFornecedor } from "@/types/clienteFornecedor.tsx"

interface ClienteFornecedorComboboxProps {
  clientesFornecedores: ClienteFornecedor[];
  value: string | null; // ID do cliente/fornecedor selecionado
  onChange: (value: string | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
}

export function ClienteFornecedorCombobox({
  clientesFornecedores,
  value,
  onChange,
  placeholder = "Selecione um cliente/fornecedor...",
  searchPlaceholder = "Buscar por nome, CPF/CNPJ...",
  emptyText = "Nenhum resultado.",
  disabled = false,
}: ClienteFornecedorComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")

  const selectedClienteFornecedor = clientesFornecedores.find(
    (cf) => cf.id === value
  )

  const filteredClientesFornecedores = React.useMemo(() => {
    if (!searchTerm.trim()) {
      return clientesFornecedores; // Mostra todos se a busca estiver vazia
    }
    return clientesFornecedores.filter((cf) =>
      cf.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cf.numeroDocumento && cf.numeroDocumento.replace(/\D/g, '').includes(searchTerm.replace(/\D/g, '')))
    );
  }, [clientesFornecedores, searchTerm]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left">
            {selectedClienteFornecedor
              ? <>
                  <span className="truncate">{selectedClienteFornecedor.nome}</span>
                  <span className="ml-1 text-xs text-muted-foreground">({selectedClienteFornecedor.tipoDocumento}: {selectedClienteFornecedor.numeroDocumento || 'N/A'})</span>
                </>
              : <span className="text-muted-foreground">{placeholder}</span>}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0" 
        style={{ width: 'var(--radix-popover-trigger-width)' }}
        sideOffset={5}
      >
        {/* A largura do PopoverContent é definida para corresponder ao gatilho, mas o conteúdo interno pode rolar se for maior. */}
        <Command shouldFilter={false}> {/* Filtramos manualmente */}
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>{searchTerm ? emptyText : "Nenhum cliente/fornecedor cadastrado."}</CommandEmpty>
            {filteredClientesFornecedores.map((cf) => (
              <CommandItem
                key={cf.id}
                value={cf.id}
                onSelect={(currentValue) => {
                  onChange(currentValue === value ? null : currentValue);
                  setOpen(false);
                  setSearchTerm(""); 
                }}
              >
                <Check className={cn("mr-2 h-4 w-4", value === cf.id ? "opacity-100" : "opacity-0")} />
                {/* Garante que o texto possa ser truncado se for muito longo */}
                <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {cf.nome} 
                  <span className="ml-2 text-xs text-muted-foreground">({cf.tipoDocumento}: {cf.numeroDocumento || 'N/A'})</span>
                </div>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}