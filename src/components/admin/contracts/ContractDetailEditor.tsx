"use client";

import { useState } from "react";
import SaveStateBadge, { type SaveState } from "@/components/admin/ui/SaveStateBadge";
import { Button } from "@/components/ui/button";

type ContractDetailEditorProps = {
  item: {
    id: string;
    contractNumber: string;
    title: string;
    counterpartyName: string;
    counterpartyEmail: string | null;
    status: "DRAFT" | "SENT" | "NEGOTIATION" | "SIGNED" | "EXPIRED" | "CANCELED";
    amount: number | null;
    currency: "CLP" | "USD" | "EUR";
    notes: string | null;
    requestId: string | null;
    trackId: string | null;
  };
};

function parseNullableInt(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function ContractDetailEditor({ item }: ContractDetailEditorProps) {
  const [contractNumber, setContractNumber] = useState(item.contractNumber);
  const [title, setTitle] = useState(item.title);
  const [counterpartyName, setCounterpartyName] = useState(item.counterpartyName);
  const [counterpartyEmail, setCounterpartyEmail] = useState(item.counterpartyEmail ?? "");
  const [status, setStatus] = useState(item.status);
  const [amount, setAmount] = useState(item.amount != null ? String(item.amount) : "");
  const [currency, setCurrency] = useState(item.currency);
  const [requestId, setRequestId] = useState(item.requestId ?? "");
  const [trackId, setTrackId] = useState(item.trackId ?? "");
  const [notes, setNotes] = useState(item.notes ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string>("");

  async function onSave() {
    setSaveState("saving");
    setError("");

    try {
      const res = await fetch(`/api/admin/contracts/${encodeURIComponent(item.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contractNumber: contractNumber.trim(),
          title: title.trim(),
          counterpartyName: counterpartyName.trim(),
          counterpartyEmail: counterpartyEmail.trim() ? counterpartyEmail.trim() : null,
          status,
          amount: parseNullableInt(amount),
          currency,
          requestId: requestId.trim() ? requestId.trim() : null,
          trackId: trackId.trim() ? trackId.trim() : null,
          notes: notes.trim() ? notes.trim() : null,
        }),
      });
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        throw new Error(payload?.error ?? "No se pudo guardar el contrato");
      }
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setSaveState("error");
    }
  }

  return (
    <section className="rounded-lg border border-border bg-background/50 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Edición rápida</h2>
        <SaveStateBadge state={saveState} className="text-xs" savingLabel="Saving..." savedLabel="DONE" errorLabel="ERROR" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">N° contrato</label>
          <input value={contractNumber} onChange={(event) => setContractNumber(event.target.value)} className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Título</label>
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contraparte</label>
          <input value={counterpartyName} onChange={(event) => setCounterpartyName(event.target.value)} className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email contraparte</label>
          <input value={counterpartyEmail} onChange={(event) => setCounterpartyEmail(event.target.value)} className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Estado</label>
          <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm">
            <option value="DRAFT">DRAFT</option>
            <option value="SENT">SENT</option>
            <option value="NEGOTIATION">NEGOTIATION</option>
            <option value="SIGNED">SIGNED</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="CANCELED">CANCELED</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Monto</label>
            <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="numeric" className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Moneda</label>
            <select value={currency} onChange={(event) => setCurrency(event.target.value as typeof currency)} className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm">
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="CLP">CLP</option>
            </select>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Track ID</label>
          <input value={trackId} onChange={(event) => setTrackId(event.target.value)} className="h-9 w-full rounded-md border border-border bg-background px-3 font-mono text-xs" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Request ID</label>
          <input value={requestId} onChange={(event) => setRequestId(event.target.value)} className="h-9 w-full rounded-md border border-border bg-background px-3 font-mono text-xs" />
        </div>
      </div>

      <div className="mt-3 space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notas</label>
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={5} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        {error ? <p className="text-xs text-destructive">{error}</p> : <span />}
        <Button type="button" size="sm" onClick={() => void onSave()}>
          Guardar cambios
        </Button>
      </div>
    </section>
  );
}
