
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { maskCurrency } from '@/utils/formatters';

interface CurrencyInputProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  required?: boolean;
}

export const CurrencyInput = ({ 
  label, 
  value, 
  onChange, 
  placeholder = "R$ 0,00",
  className,
  id,
  required 
}: CurrencyInputProps) => {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value > 0) {
      setDisplayValue(maskCurrency((value * 100).toString()));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const cleanValue = inputValue.replace(/\D/g, '');
    
    if (cleanValue === '') {
      setDisplayValue('');
      onChange(0);
      return;
    }

    const numericValue = parseFloat(cleanValue) / 100;
    setDisplayValue(maskCurrency(cleanValue));
    onChange(numericValue);
  };

  return (
    <div className="space-y-1">
      {label && <Label htmlFor={id}>{label}</Label>}
      <Input
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
};
