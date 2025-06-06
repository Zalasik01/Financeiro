import React from "react";

const AdminFooter: React.FC = () => {
  return (
    <footer className="bg-slate-800 text-slate-400 text-center p-4 mt-auto">
      <div className="container mx-auto">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} Painel Administrativo - Financeiro
          App. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
};

export default AdminFooter;
