import { createClient } from "@/lib/supabase/server"
import { MasterDataClient } from "@/components/master-data-client"

type Product = {
  id: string
  barcode: string
  product_name: string
  uom: string
  selling_price: number
  created_at: string
}

export default async function MasterDataPage() {
  const supabase = await createClient()

  // Ambil semua data dengan pagination dari Supabase
  const allProducts: Product[] = []
  let page = 0
  const pageSize = 1000

  try {
    while (true) {
      const { data, error } = await supabase
        .from("master_products")
        .select("*")
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (error) {
        console.error("Error fetching products:", error)
        break
      }

      if (!data || data.length === 0) {
        break
      }

      allProducts.push(...(data as Product[]))

      // Jika data kurang dari pageSize, berarti sudah habis
      if (data.length < pageSize) {
        break
      }

      page++
    }
  } catch (error) {
    console.error("Error fetching all products:", error)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Master Data Produk</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <MasterDataClient initialProducts={allProducts} />
      </main>
    </div>
  )
}