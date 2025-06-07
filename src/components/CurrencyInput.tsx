import React, { useState, useEffect, forwardRef } from "react"; // Importar forwardRef
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { maskCurrency } from "@/utils/formatters";

interface CurrencyInputProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  className?: string;
  id?: string;
  placeholder?: string;
  required?: boolean; // Manter required
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      label,
      value,
      onChange,
      placeholder = "R$ 0,00",
      className,
      id,
      required,
    },
    ref // Ref encaminhada
  ) => {
    const [displayValue, setDisplayValue] = useState("");

    useEffect(() => {
      if (typeof value === "number" && !Number.isNaN(value)) {
        if (value === 0) {
          // Se o valor é 0, o display deve ser vazio (para placeholder)
          // A MENOS QUE o displayValue já seja a representação de zero (ex: "R$ 0,00")
          // Isso acontece quando o usuário digita "0" e o handleChange atualiza o display.
          const maskedZero = maskCurrency("0"); // Ex: "R$ 0,00"
          if (displayValue !== maskedZero && displayValue !== "") {
            // Só limpa se não for "R$ 0,00" e não estiver já vazio
            setDisplayValue("");
          }
          // Se displayValue já é maskedZero ou '', não faz nada.
        } else {
          // value is not 0
          // Multiplica por 100 para obter centavos, toFixed(0) para garantir inteiro como string
          const centsAsString = (value * 100).toFixed(0);
          setDisplayValue(maskCurrency(centsAsString));
        }
      } else {
        // value is not a valid number (NaN, undefined, null, etc.)
        setDisplayValue("");
      }
    }, [value, displayValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const cleanValue = inputValue.replace(/\D/g, ""); // Remove todos os não dígitos

      if (cleanValue === "" || cleanValue === undefined) {
        setDisplayValue("");
        onChange(0);
        return;
      }

      // Se o valor limpo for apenas zeros (ex: "0", "00", "000")
      if (Number(cleanValue) === 0) {
        setDisplayValue(maskCurrency("0")); // Mostra "R$ 0,00" (ou formatação de zero da sua máscara)
        onChange(0);
        return;
      }

      // Para outros números, processar normalmente
      const numericValue = parseFloat(cleanValue) / 100; // Converte centavos para reais
      setDisplayValue(maskCurrency(cleanValue)); // maskCurrency espera a string de centavos
      onChange(numericValue); // Emite o valor em reais
    };

    return (
      <div className="space-y-1">
        {label && (
          <Label htmlFor={id}>
            {label}
            {required ? " *" : ""}
          </Label>
        )}
        <Input
          ref={ref} // Atribuir a ref ao Input interno
          id={id}
          type="text"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={`${className} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
          required={required}
        />
      </div>
    );
  }
);
