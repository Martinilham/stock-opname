import { createClient } from "@/lib/supabase/server"
import { ScannerClient } from "@/components/scanner-client"
import { notFound } from "next/navigation"

export default async function ScanPage({ params }: { params: Promise<{ locationId: string }> }) {
  const { locationId } = await params
  const supabase = await createClient()

  const { data: location } = await supabase.from("locations").select("*").eq("id", locationId).single()

  if (!location) {
    notFound()
  }

  const { data: stockCounts } = await supabase
    .from("stock_counts")
    .select("*")
    .eq("location_id", locationId)
    .order("counted_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Scan Barcode - {location.name}</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <ScannerClient location={location} initialStockCounts={stockCounts || []} />
      </main>
    </div>
  )
}
