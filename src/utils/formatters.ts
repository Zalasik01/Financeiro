export const formatCNPJ = (cnpj: string): string => {
  const cleanCNPJ = cnpj.replace(/\D/g, "");
  return cleanCNPJ.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    "$1.$2.$3/$4-$5"
  );
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const maskCPF = (value: string): string => {
  if (!value) return "";
  value = value.replace(/\D/g, ""); // Remove tudo o que não é dígito
  value = value.replace(/(\d{3})(\d)/, "$1.$2"); // Coloca um ponto entre o terceiro e o quarto dígitos
  value = value.replace(/(\d{3})(\d)/, "$1.$2"); // Coloca um ponto entre o terceiro e o quarto dígitos novamente (para o segundo bloco de 3)
  value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2"); // Coloca um hífen entre o terceiro e o quarto dígitos (para os dois últimos)
  return value.slice(0, 14); // Limita a 14 caracteres (XXX.XXX.XXX-XX)
};


export const maskCEP = (value: string): string => {
  if (!value) return "";
  value = value.replace(/\D/g, "");
  value = value.replace(/^(\d{5})(\d)/, "$1-$2");
  return value.slice(0, 9); // XXXXX-XXX
};

export const maskPhone = (value: string): string => {
  if (!value) return "";
  value = value.replace(/\D/g, "");
  value = value.replace(/^(\d{2})(\d)/g, "($1) $2"); // Coloca parênteses em volta dos dois primeiros dígitos
  value = value.replace(/(\d)(\d{4})$/, "$1-$2"); // Coloca hífen antes dos últimos 4 dígitos
  return value.slice(0, 15); // (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
};

export const parseCurrency = (value: string): number => {
  const cleanValue = value.replace(/[^\d,]/g, "").replace(",", ".");
  return parseFloat(cleanValue) || 0;
};

export const maskCurrency = (value: string): string => {
  const cleanValue = value.replace(/\D/g, "");
  const numericValue = parseFloat(cleanValue) / 100;

  if (isNaN(numericValue)) return "R$ 0,00";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numericValue);
};

export const maskCNPJ = (value: string): string => {
  const cleanValue = value.replace(/\D/g, "");
  return cleanValue.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    "$1.$2.$3/$4-$5"
  );
};

export const onlyNumbers = (value: string): string => {
  return value.replace(/\D/g, "");
};
