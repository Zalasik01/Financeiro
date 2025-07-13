import React from "react";

interface DataTableProps {
  children: React.ReactNode;
  className?: string;
}

interface DataTableHeaderProps {
  children: React.ReactNode;
}

interface DataTableBodyProps {
  children: React.ReactNode;
}

interface DataTableRowProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

interface DataTableCellProps {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
  colSpan?: number;
}

interface DataTableHeaderCellProps {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}

export const DataTable: React.FC<DataTableProps> = ({ children, className = "" }) => {
  return (
    <div className="overflow-x-auto border border-gray-300 rounded-lg">
      <table className={`w-full border-collapse ${className}`}>
        {children}
      </table>
    </div>
  );
};

export const DataTableHeader: React.FC<DataTableHeaderProps> = ({ children }) => {
  return (
    <thead className="bg-gray-50">
      {children}
    </thead>
  );
};

export const DataTableBody: React.FC<DataTableBodyProps> = ({ children }) => {
  return (
    <tbody>
      {children}
    </tbody>
  );
};

export const DataTableRow: React.FC<DataTableRowProps> = ({ 
  children, 
  onClick, 
  className = "" 
}) => {
  return (
    <tr 
      className={`hover:bg-gray-50 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

export const DataTableCell: React.FC<DataTableCellProps> = ({ 
  children, 
  className = "",
  align = "left",
  colSpan
}) => {
  const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  
  return (
    <td className={`border border-gray-300 px-4 py-2 ${alignClass} ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
};

export const DataTableHeaderCell: React.FC<DataTableHeaderCellProps> = ({ 
  children, 
  className = "",
  align = "left"
}) => {
  const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  
  return (
    <th className={`border border-gray-300 px-4 py-2 font-semibold text-gray-700 ${alignClass} ${className}`}>
      {children}
    </th>
  );
};
