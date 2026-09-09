import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";

// GET /api/admin/geocode?address=Rue+Saint-Joseph+4,+1227+Carouge
export async function GET(req: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");
  if (!address) return NextResponse.json({ error: "Adresse manquante" }, { status: 400 });

  const query = `${address}, Genève, Suisse`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=ch`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "MAG-Admin/1.0 (metiersdart-geneve.ch)" },
    });
    const data = await res.json();

    if (data && data.length > 0) {
      return NextResponse.json({
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        display_name: data[0].display_name,
      });
    }

    return NextResponse.json({ error: "Adresse non trouvée" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Erreur de géocodage" }, { status: 500 });
  }
}
