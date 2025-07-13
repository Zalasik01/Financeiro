import { z } from 'zod';
import { APP_CONFIG, VALIDATION_RULES } from '@/config/app';

// Schemas de validação
export const transactionSchema = z.object({
  amount: z.number()
    .positive('Valor deve ser positivo')
    .max(APP_CONFIG.validation.maxTransactionAmount, 'Valor muito alto'),
  description: z.string()
    .min(1, 'Descrição é obrigatória')
    .max(APP_CONFIG.validation.maxDescriptionLength, 'Descrição muito longa'),
  type: z.enum(['Receita', 'Despesa'], {
    errorMap: () => ({ message: 'Tipo deve ser Receita ou Despesa' })
  }),
  date: z.date({
    errorMap: () => ({ message: 'Data inválida' })
  }),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  storeId: z.string().optional(),
  personId: z.string().optional(),
  paymentMethodId: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(50, 'Nome muito longo'),
  icon: z.string().optional(),
  color: z.string().optional(),
  ativo: z.boolean().default(true),
});

export const storeSchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome muito longo'),
  cnpj: z.string()
    .regex(VALIDATION_RULES.cnpj, 'CNPJ inválido')
    .optional(),
  ativo: z.boolean().default(true),
  address: z.object({
    zipCode: z.string()
      .regex(VALIDATION_RULES.cep, 'CEP inválido')
      .min(1, 'CEP é obrigatório'),
    street: z.string().min(1, 'Logradouro é obrigatório'),
    number: z.string().min(1, 'Número é obrigatório'),
    complement: z.string().optional(),
    neighborhood: z.string().min(1, 'Bairro é obrigatório'),
    city: z.string().min(1, 'Cidade é obrigatória'),
    state: z.string()
      .min(2, 'Estado é obrigatório')
      .max(2, 'Estado deve ter 2 caracteres')
      .regex(/^[A-Z]{2}$/, 'Estado deve conter apenas letras maiúsculas'),
  }).optional(),
});

export const userProfileSchema = z.object({
  displayName: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome muito longo'),
  email: z.string()
    .email('E-mail inválido')
    .regex(VALIDATION_RULES.email, 'Formato de e-mail inválido'),
  photoURL: z.string().url('URL da foto inválida').optional(),
});

export const loginSchema = z.object({
  email: z.string()
    .email('E-mail inválido')
    .regex(VALIDATION_RULES.email, 'Formato de e-mail inválido'),
  password: z.string()
    .min(APP_CONFIG.validation.minPasswordLength, `Senha deve ter pelo menos ${APP_CONFIG.validation.minPasswordLength} caracteres`),
});

export const signupSchema = loginSchema.extend({
  displayName: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome muito longo'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

// Utilitários de validação
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown) => {
  try {
    return {
      success: true as const,
      data: schema.parse(data),
      errors: [],
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false as const,
        data: null,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      };
    }
    return {
      success: false as const,
      data: null,
      errors: [{ field: 'unknown', message: 'Erro de validação desconhecido' }],
    };
  }
};

export const validateTransaction = (data: unknown) => 
  validateData(transactionSchema, data);

export const validateCategory = (data: unknown) => 
  validateData(categorySchema, data);

export const validateStore = (data: unknown) => 
  validateData(storeSchema, data);

export const validateUserProfile = (data: unknown) => 
  validateData(userProfileSchema, data);

export const validateLogin = (data: unknown) => 
  validateData(loginSchema, data);

export const validateSignup = (data: unknown) => 
  validateData(signupSchema, data);

// Types derivados dos schemas
export type TransactionInput = z.infer<typeof transactionSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type StoreInput = z.infer<typeof storeSchema>;
export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
