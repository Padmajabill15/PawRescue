"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Download, Search } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: keyof T & string;
  label: string;
  render?: (row: T) => ReactNode;
  align?: "right";
}

type Row = Record<string, unknown>;

const toText = (v: unknown) =>
  v === null || v === undefined ? "" : v instanceof Date ? v.toISOString() : typeof v === "boolean" ? (v ? "yes" : "no") : String(v);

function csv<T extends Row>(rows: T[], cols: Column<T>[]) {
  const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  return [cols.map((c) => esc(c.label)).join(","), ...rows.map((r) => cols.map((c) => esc(toText(r[c.key]))).join(","))].join("\n");
}

/** Searchable, sortable table with CSV export of exactly what's filtered. */
export function DataTable<T extends Row>({ rows, columns, filename }: { rows: T[]; columns: Column<T>[]; filename: string }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = needle ? rows.filter((r) => columns.some((c) => toText(r[c.key]).toLowerCase().includes(needle))) : rows;
    if (sort) {
      out = [...out].sort((a, b) => {
        const x = a[sort.key];
        const y = b[sort.key];
        if (typeof x === "number" && typeof y === "number") return (x - y) * sort.dir;
        return toText(x).localeCompare(toText(y), undefined, { numeric: true }) * sort.dir;
      });
    }
    return out;
  }, [rows, columns, q, sort]);

  function download() {
    const blob = new Blob(["﻿" + csv(shown, columns)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search any column" className="pl-9" aria-label="Search" />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {shown.length} of {rows.length}
          </span>
          <Button size="sm" variant="outline" onClick={download} disabled={!shown.length}>
            <Download className="h-4 w-4" /> Download CSV
          </Button>
        </div>
      </div>
      <div className="max-h-[65vh] overflow-auto rounded-xl border">
        <table className="w-full min-w-max text-sm">
          <thead className="sticky top-0 z-10 bg-muted">
            <tr>
              {columns.map((c) => {
                const active = sort?.key === c.key;
                const Icon = !active ? ArrowUpDown : sort!.dir === 1 ? ArrowUp : ArrowDown;
                return (
                  <th key={c.key} className={cn("whitespace-nowrap px-3 py-2.5 text-left font-semibold", c.align === "right" && "text-right")}>
                    <button
                      className="inline-flex items-center gap-1 hover:text-primary"
                      onClick={() => setSort(active && sort!.dir === -1 ? null : { key: c.key, dir: active ? -1 : 1 })}
                      aria-label={`Sort by ${c.label}`}
                    >
                      {c.label}
                      <Icon className={cn("h-3.5 w-3.5", !active && "opacity-40")} />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={String(r.id ?? i)} className="border-t hover:bg-muted/50">
                {columns.map((c) => (
                  <td key={c.key} className={cn("whitespace-nowrap px-3 py-2", c.align === "right" && "text-right tabular-nums")}>
                    {c.render ? c.render(r) : toText(r[c.key])}
                  </td>
                ))}
              </tr>
            ))}
            {!shown.length && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-10 text-center text-muted-foreground">
                  Nothing matches your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
