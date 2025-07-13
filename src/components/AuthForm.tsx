import React from 'react';
import { useFormValidation } from '@/hooks/useFormValidation';
import { loginSchema, signupSchema, LoginInput, SignupInput } from '@/utils/validation';
import { FormInput, FormErrors } from '@/components/ui/FormComponents';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AuthFormProps {
  mode: 'login' | 'signup';
  onSuccess?: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ mode, onSuccess }) => {
  const { login, register } = useAuth();
  const { toast } = useToast();

  const schema = mode === 'login' ? loginSchema : signupSchema;
  
  const {
    values,
    errors,
    isSubmitting,
    isValid,
    updateField,
    validateField,
    handleSubmit,
    getFieldError,
  } = useFormValidation({
    schema,
    onSubmit: async (data) => {
      try {
        if (mode === 'login') {
          const loginData = data as LoginInput;
          await login(loginData.email, loginData.password);
        } else {
          const signupData = data as SignupInput;
          await register(
            signupData.email, 
            signupData.password, 
            signupData.displayName
          );
        }
        
        toast({
          title: 'Sucesso',
          description: mode === 'login' ? 'Login realizado!' : 'Conta criada!',
        });
        
        onSuccess?.();
      } catch (error) {
        toast({
          title: 'Erro',
          description: mode === 'login' ? 'Falha no login' : 'Falha ao criar conta',
          variant: 'destructive',
        });
        throw error;
      }
    },
  });

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          {mode === 'login' ? 'Entrar' : 'Criar Conta'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormErrors errors={errors} />
          
          {mode === 'signup' && (
            <FormInput
              label="Nome"
              value={values.displayName || ''}
              onChange={(e) => updateField('displayName', e.target.value)}
              onBlur={() => validateField('displayName')}
              error={getFieldError('displayName')}
              placeholder="Seu nome completo"
              required
            />
          )}

          <FormInput
            label="E-mail"
            type="email"
            value={values.email || ''}
            onChange={(e) => updateField('email', e.target.value)}
            onBlur={() => validateField('email')}
            error={getFieldError('email')}
            placeholder="seu@email.com"
            required
          />

          <FormInput
            label="Senha"
            type="password"
            value={values.password || ''}
            onChange={(e) => updateField('password', e.target.value)}
            onBlur={() => validateField('password')}
            error={getFieldError('password')}
            placeholder="Sua senha"
            required
          />

          {mode === 'signup' && (
            <FormInput
              label="Confirmar Senha"
              type="password"
              value={values.confirmPassword || ''}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              onBlur={() => validateField('confirmPassword')}
              error={getFieldError('confirmPassword')}
              placeholder="Confirme sua senha"
              required
            />
          )}

          <Button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="w-full"
          >
            {isSubmitting 
              ? (mode === 'login' ? 'Entrando...' : 'Criando conta...') 
              : (mode === 'login' ? 'Entrar' : 'Criar Conta')
            }
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
