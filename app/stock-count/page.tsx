import { createClient } from "@/lib/supabase/server"
import { StockCountClient } from "@/components/stock-count-client"

export default async function StockCountPage() {
  const supabase = await createClient()
  const { data: locations } = await supabase.from("locations").select("*").order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Stock Count</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <StockCountClient initialLocations={locations || []} />
      </main>
    </div>
  )
}
