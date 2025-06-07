
import React from "react";
import { Outlet } from "react-router-dom";
import AdminHeader from "./AdminHeader";
import AdminFooter from "./AdminFooter";

const AdminLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100 dark:bg-slate-900">
      <AdminHeader />
      <main className="flex-grow container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Outlet /> {/* Conteúdo da página admin será renderizado aqui */}
      </main>
      <AdminFooter />
    </div>
  );
};

export default AdminLayout;
