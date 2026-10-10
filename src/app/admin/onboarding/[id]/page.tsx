import { DossierEditor } from "@/components/admin/DossierEditor";

export const dynamic = "force-dynamic";

// Dossier d'onboarding d'un·e artisan·e (LOT A1). Le layout admin vérifie la
// session ; les données sont chargées côté client par les routes /api/admin.
export default async function AdminDossierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DossierEditor id={id} />;
}
