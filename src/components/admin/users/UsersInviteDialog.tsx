"use client";

import { MailPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function UsersInviteDialog({ returnTo }: { returnTo: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-background px-2.5 text-sm transition-colors hover:bg-muted/45">
          <MailPlus className="h-3.5 w-3.5" />
          Invitar usuario
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Crear invitación</DialogTitle>
          <DialogDescription>
            Envía un acceso nuevo definiendo rol y vigencia.
          </DialogDescription>
        </DialogHeader>
        <form method="POST" action="/admin/users/invite" className="space-y-3">
          <input type="hidden" name="returnTo" value={returnTo} />

          <div className="grid gap-2">
            <label className="text-xs uppercase text-muted-foreground" htmlFor="users-dialog-invite-email">
              Email
            </label>
            <input
              id="users-dialog-invite-email"
              type="email"
              name="email"
              required
              placeholder="email@dominio.com"
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr,110px]">
            <div className="grid gap-2">
              <label className="text-xs uppercase text-muted-foreground" htmlFor="users-dialog-invite-role">
                Rol
              </label>
              <select
                id="users-dialog-invite-role"
                name="role"
                defaultValue="CREATOR"
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="CLIENT">CLIENT</option>
                <option value="CREATOR">CREATOR</option>
                <option value="STAFF">STAFF</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-xs uppercase text-muted-foreground" htmlFor="users-dialog-invite-days">
                Días
              </label>
              <input
                id="users-dialog-invite-days"
                type="number"
                name="expiresDays"
                min={1}
                max={30}
                defaultValue={7}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button className="h-9 rounded-md border border-border px-3 text-sm transition-colors hover:bg-muted/45">
              Crear invitación
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
