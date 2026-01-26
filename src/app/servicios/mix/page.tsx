import MixFormClient from "./MixFormClient";

export const metadata = {
  title: "Servicios · Mix & Master",
  description:
    "Formulario multistep para solicitar mezcla y masterización (Single Track o EP/Álbum).",
};

export default function MixServicesPage() {
  return (
    <div className="bg-background text-foreground">
      <MixFormClient />
    </div>
  );
}
