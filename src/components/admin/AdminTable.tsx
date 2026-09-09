"use client";

import { useState } from "react";

type Column = {
  key: string;
  label: string;
  render?: (row: Record<string, unknown>) => React.ReactNode;
};

type Props = {
  columns: Column[];
  rows: Record<string, unknown>[];
  onEdit?: (row: Record<string, unknown>) => void;
  onDelete?: (row: Record<string, unknown>) => void;
  onAdd?: () => void;
  addLabel?: string;
};

export function AdminTable({ columns, rows, onEdit, onDelete, onAdd, addLabel = "Ajouter" }: Props) {
  return (
    <div>
      {onAdd && (
        <button
          onClick={onAdd}
          className="mb-4 inline-flex items-center gap-2 rounded-lg bg-mag-red px-4 py-2 text-sm font-semibold text-white hover:bg-mag-red-dark transition-colors"
        >
          <i className="fas fa-plus" aria-hidden />
          {addLabel}
        </button>
      )}
      <div className="overflow-x-auto rounded-xl border border-mag-cream shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-mag-cream/50 text-mag-dark/80">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 font-semibold whitespace-nowrap">
                  {col.label}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-4 py-3 font-semibold w-24">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-mag-cream/60">
            {rows.map((row, i) => (
              <tr key={String(row.id ?? i)} className="hover:bg-mag-cream/20 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-mag-dark/70">
                    {col.render ? col.render(row) : String(row[col.key] ?? "")}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          className="text-mag-gray hover:text-mag-red transition-colors"
                          aria-label="Modifier"
                        >
                          <i className="fas fa-pen" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row)}
                          className="text-mag-gray hover:text-red-500 transition-colors"
                          aria-label="Supprimer"
                        >
                          <i className="fas fa-trash" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminField({
  label,
  name,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  value: string | number | undefined;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-mag-gray mb-1 block">{label}</span>
      <input
        type={type}
        name={name}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-mag-cream bg-white px-3 py-2 text-sm focus:border-mag-red focus:outline-none focus:ring-2 focus:ring-mag-red/20"
      />
    </label>
  );
}

export function AdminTextarea({
  label,
  name,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  name: string;
  value: string | undefined;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-mag-gray mb-1 block">{label}</span>
      <textarea
        name={name}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-lg border border-mag-cream bg-white px-3 py-2 text-sm focus:border-mag-red focus:outline-none focus:ring-2 focus:ring-mag-red/20"
      />
    </label>
  );
}

export function AdminSelect({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-mag-gray mb-1 block">{label}</span>
      <select
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-mag-cream bg-white px-3 py-2 text-sm focus:border-mag-red focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function useModal() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  return { open, editing, setOpen, setEditing };
}
