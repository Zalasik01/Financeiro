import { useAuth } from "./useAuth";

export const useApplication = () => {
  const { currentUser, accessToken } = useAuth();

  return {
    access_token: accessToken,
    usuario: currentUser
      ? {
          id: currentUser.id,
          nome: currentUser.nome,
          email: currentUser.email,
          admin: currentUser.admin,
        }
      : null,
  };
};
