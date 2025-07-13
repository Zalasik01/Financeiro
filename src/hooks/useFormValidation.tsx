import { useCallback, useState } from 'react';
import { validateData } from '@/utils/validation';
import { z } from 'zod';

interface UseFormValidationOptions<T> {
  schema: z.ZodSchema<T>;
  onSubmit?: (data: T) => void | Promise<void>;
  initialValues?: Partial<T>;
}

interface FormState<T> {
  values: Partial<T>;
  errors: Array<{ field: string; message: string }>;
  isSubmitting: boolean;
  isValid: boolean;
  touchedFields: Set<string>;
}

export const useFormValidation = <T extends Record<string, any>>({
  schema,
  onSubmit,
  initialValues = {},
}: UseFormValidationOptions<T>) => {
  const [state, setState] = useState<FormState<T>>({
    values: initialValues,
    errors: [],
    isSubmitting: false,
    isValid: false,
    touchedFields: new Set(),
  });

  const updateField = useCallback((field: keyof T, value: any) => {
    setState(prev => {
      const newValues = { ...prev.values, [field]: value };
      const validation = validateData(schema, newValues);
      
      return {
        ...prev,
        values: newValues,
        errors: validation.success ? [] : validation.errors,
        isValid: validation.success,
        touchedFields: new Set([...prev.touchedFields, field as string]),
      };
    });
  }, [schema]);

  const validateField = useCallback((field: keyof T) => {
    setState(prev => {
      // Valida o formulário inteiro e filtra apenas erros do campo específico
      const validation = validateData(schema, prev.values);
      const fieldErrors = validation.success ? [] : validation.errors.filter(err => err.field === field || err.field.startsWith(`${String(field)}.`));
      const otherErrors = prev.errors.filter(err => err.field !== field && !err.field.startsWith(`${String(field)}.`));
      
      return {
        ...prev,
        errors: [...otherErrors, ...fieldErrors],
        touchedFields: new Set([...prev.touchedFields, field as string]),
      };
    });
  }, [schema]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    setState(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      const validation = validateData(schema, state.values);
      
      if (!validation.success) {
        setState(prev => ({
          ...prev,
          errors: validation.errors,
          isSubmitting: false,
          touchedFields: new Set(Object.keys(prev.values)),
        }));
        return false;
      }
      
      if (onSubmit) {
        await onSubmit(validation.data);
      }
      
      setState(prev => ({ ...prev, isSubmitting: false, errors: [] }));
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        errors: [{ field: 'submit', message: 'Erro ao enviar formulário' }],
      }));
      return false;
    }
  }, [schema, state.values, onSubmit]);

  const reset = useCallback(() => {
    setState({
      values: initialValues,
      errors: [],
      isSubmitting: false,
      isValid: false,
      touchedFields: new Set(),
    });
  }, [initialValues]);

  const getFieldError = useCallback((field: keyof T) => {
    const error = state.errors.find(err => err.field === field);
    const isTouched = state.touchedFields.has(field as string);
    return isTouched ? error?.message : undefined;
  }, [state.errors, state.touchedFields]);

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    updateField(field, value);
  }, [updateField]);

  const setFieldValues = useCallback((values: Partial<T>) => {
    setState(prev => {
      const newValues = { ...prev.values, ...values };
      const validation = validateData(schema, newValues);
      
      return {
        ...prev,
        values: newValues,
        errors: validation.success ? [] : validation.errors,
        isValid: validation.success,
      };
    });
  }, [schema]);

  return {
    values: state.values,
    errors: state.errors,
    isSubmitting: state.isSubmitting,
    isValid: state.isValid,
    updateField,
    validateField,
    handleSubmit,
    reset,
    getFieldError,
    setFieldValue,
    setFieldValues,
    touchedFields: state.touchedFields,
  };
};
