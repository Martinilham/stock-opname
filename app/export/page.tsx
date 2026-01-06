import { createClient } from "@/lib/supabase/server"
import { ExportClient } from "@/components/export-client"

export default async function ExportPage() {
  const supabase = await createClient()

  // Get all locations with their stock count data
  const { data: locations } = await supabase.from("locations").select("*").order("created_at", { ascending: false })

  // Get stock counts grouped by location
  const locationsWithCounts = await Promise.all(
    (locations || []).map(async (location) => {
      const { data: counts, error } = await supabase
        .from("stock_counts")
        .select("*")
        .eq("location_id", location.id)
        .order("counted_at", { ascending: false })

      return {
        ...location,
        stockCounts: counts || [],
        totalItems: (counts || []).reduce((sum, c) => sum + c.count, 0),
      }
    }),
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Export Data Stock Count</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <ExportClient locations={locationsWithCounts} />
      </main>
    </div>
  )
}
