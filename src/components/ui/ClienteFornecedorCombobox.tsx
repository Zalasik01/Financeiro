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
          {selectedClienteFornecedor
            ? `${selectedClienteFornecedor.nome} (${selectedClienteFornecedor.tipoDocumento}: ${selectedClienteFornecedor.numeroDocumento || 'N/A'})`
            : <span className="text-muted-foreground">{placeholder}</span>}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
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
                <span>{cf.nome} <span className="text-xs text-muted-foreground">({cf.tipoDocumento}: {cf.numeroDocumento || 'N/A'})</span></span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}