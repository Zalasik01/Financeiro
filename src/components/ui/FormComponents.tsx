import React from 'react';
import { cn } from '@/lib/utils';
import { useViaCEP, AddressData } from '@/hooks/useViaCEP';
import { Search, Loader2 } from 'lucide-react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, type, label, error, required, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 outline-none",
            error && "border-red-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  required?: boolean;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ className, label, error, required, options, placeholder, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <select
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 outline-none",
            error && "border-red-500",
            className
          )}
          ref={ref}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

FormSelect.displayName = "FormSelect";

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ className, label, error, required, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 outline-none",
            error && "border-red-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

FormTextarea.displayName = "FormTextarea";

interface FormErrorsProps {
  errors: Array<{ field: string; message: string }>;
}

export const FormErrors: React.FC<FormErrorsProps> = ({ errors }) => {
  if (!errors.length) return null;

  return (
    <div className="space-y-1">
      {errors.map((error, index) => (
        <p key={index} className="text-sm text-red-500">
          {error.message}
        </p>
      ))}
    </div>
  );
};

interface FormCEPInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  required?: boolean;
  onAddressFound?: (address: AddressData) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoSearch?: boolean;
}

export const FormCEPInput = React.forwardRef<HTMLInputElement, FormCEPInputProps>(
  ({ 
    className, 
    label, 
    error, 
    required, 
    onAddressFound, 
    onChange,
    autoSearch = true,
    value = '',
    ...props 
  }, ref) => {
    const { searchAddress, loading, formatCEP, validateCEP } = useViaCEP({
      onAddressFound,
      showToast: true,
    });

    const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formattedCEP = formatCEP(e.target.value);
      
      // Create a new event with formatted value
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: formattedCEP
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      onChange?.(syntheticEvent);

      // Auto busca quando CEP estiver completo
      if (autoSearch && validateCEP(formattedCEP)) {
        searchAddress(formattedCEP);
      }
    };

    const handleSearchClick = () => {
      if (validateCEP(value as string)) {
        searchAddress(value as string);
      }
    };

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            type="text"
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 outline-none",
              error && "border-red-500",
              className
            )}
            value={value}
            onChange={handleCEPChange}
            placeholder="00000-000"
            maxLength={9}
            ref={ref}
            {...props}
          />
          <button
            type="button"
            onClick={handleSearchClick}
            disabled={loading || !validateCEP(value as string)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Buscar endereço"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
            ) : (
              <Search className="h-4 w-4 text-gray-500" />
            )}
          </button>
        </div>
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        <p className="text-xs text-gray-500">
          Digite o CEP para buscar o endereço automaticamente
        </p>
      </div>
    );
  }
);

FormCEPInput.displayName = "FormCEPInput";
