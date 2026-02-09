import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import FormField from "@/components/admin/ui/FormField";

type Props = {
  mfnChecked: boolean;
  setMfnChecked: (v: boolean) => void;
  oneStopChecked: boolean;
  setOneStopChecked: (v: boolean) => void;
  clearedChecked: boolean;
  setClearedChecked: (v: boolean) => void;
  contentIdChecked: boolean;
  setContentIdChecked: (v: boolean) => void;
  track: {
    contentIdAdmin: string;
    contentIdWhitelist: string;
    master: string;
    restrictions?: string[] | null;
  };
  serverErrors?: Record<string, string[]>;
};

function firstError(errors: Record<string, string[]> | undefined, key: string) {
  if (!errors) return null;
  const arr = errors[key];
  return arr && arr.length > 0 ? arr[0] : null;
}

export function RightsToggles({
  mfnChecked,
  setMfnChecked,
  oneStopChecked,
  setOneStopChecked,
  clearedChecked,
  setClearedChecked,
  contentIdChecked,
  setContentIdChecked,
  track,
  serverErrors,
}: Props) {
  return (
    <div className="space-y-2 pt-1">
      <div className="rounded-md border border-border bg-card/70 p-2">
        <div className="flex items-center gap-2">
          <input type="hidden" name="mfn" value={mfnChecked ? "true" : "false"} />
          <Checkbox id="mfn" checked={mfnChecked} onCheckedChange={(v) => setMfnChecked(v === true)} />
          <Label htmlFor="mfn" className="text-sm">
            MFN (Most Favored Nation)
          </Label>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card/70 p-2">
        <div className="flex items-center gap-2">
          <input type="hidden" name="oneStop" value={oneStopChecked ? "true" : "false"} />
          <Checkbox
            id="oneStop"
            checked={oneStopChecked}
            onCheckedChange={(v) => setOneStopChecked(v === true)}
          />
          <Label htmlFor="oneStop" className="text-sm">
            One-Stop (control total de master + publishing)
          </Label>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card/70 p-2">
        <div className="flex items-center gap-2">
          <input type="hidden" name="clearedForSync" value={clearedChecked ? "true" : "false"} />
          <Checkbox
            id="cleared"
            checked={clearedChecked}
            onCheckedChange={(v) => setClearedChecked(v === true)}
          />
          <Label htmlFor="cleared" className="text-sm">
            Clear para sync (sin issues conocidos)
          </Label>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card/70 p-2">
        <div className="flex items-center gap-2">
          <input type="hidden" name="contentIdEnrolled" value={contentIdChecked ? "true" : "false"} />
          <Checkbox
            id="contentId"
            checked={contentIdChecked}
            onCheckedChange={(v) => setContentIdChecked(v === true)}
          />
          <Label htmlFor="contentId" className="text-sm">
            Content ID (YouTube) habilitado
          </Label>
        </div>
      </div>

      <FormField
        label="Content ID Admin"
        descriptionPosition="below"
        description="ID/cuenta administradora de Content ID (quien reclama y gestiona monetización)."
        error={firstError(serverErrors, "contentIdAdmin")}
      >
        <Input name="contentIdAdmin" defaultValue={track.contentIdAdmin} className="text-xs" />
      </FormField>
      <FormField
        label="Content ID Whitelist"
        descriptionPosition="below"
        description="Canales permitidos para usar el audio sin reclamación (uno por línea o texto libre)."
        error={firstError(serverErrors, "contentIdWhitelist")}
      >
        <Textarea
          name="contentIdWhitelist"
          defaultValue={track.contentIdWhitelist}
          className="text-xs"
          rows={2}
        />
      </FormField>
      <FormField
        label="Master (titular único)"
        descriptionPosition="below"
        description="Usar solo cuando existe un único dueño del master. Si hay varios titulares, usar la lista MASTER."
        error={firstError(serverErrors, "master")}
      >
        <Input
          name="master"
          defaultValue={track.master}
          className="text-xs"
          placeholder="Solo si hay un único dueño del master"
        />
      </FormField>
      <FormField
        label="Restricciones"
        descriptionPosition="below"
        description="Condiciones legales/comerciales adicionales para licenciar este track."
        error={firstError(serverErrors, "restrictions")}
      >
        <Textarea
          name="restrictions"
          defaultValue={(track.restrictions ?? []).join("\n")}
          className="text-xs"
          rows={2}
        />
      </FormField>
    </div>
  );
}
