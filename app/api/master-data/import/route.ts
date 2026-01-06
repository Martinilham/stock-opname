import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

type Product = {
  barcode: string
  product_name: string
  uom: string
  selling_price: number
}

export async function POST(request: Request) {
  try {
    const { products } = await request.json()
    const supabase = await createClient()

    if (!products || products.length === 0) {
      return NextResponse.json({ message: "No products to import" }, { status: 400 })
    }

    // Filter produk yang valid (harga > 0 dan barcode tidak kosong)
    const validProducts = (products as Product[]).filter(
      (p) => p.barcode && p.barcode.trim() !== "" && p.selling_price > 0
    )

    if (validProducts.length === 0) {
      return NextResponse.json(
        { message: "Tidak ada produk valid untuk diimport (pastikan barcode dan harga tidak kosong/0)" },
        { status: 400 }
      )
    }

    // Remove duplicates berdasarkan barcode
    const uniqueProducts = Array.from(
      new Map(validProducts.map((p: Product) => [p.barcode, p])).values()
    ) as Product[]

    // Insert atau update data
    const { data, error } = await supabase
      .from("master_products")
      .upsert(
        uniqueProducts.map((p: Product) => ({
          barcode: p.barcode,
          product_name: p.product_name,
          uom: p.uom,
          selling_price: p.selling_price,
        })),
        { onConflict: "barcode" }
      )
      .select()

    if (error) {
      console.error("Error importing products:", error)
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `${data.length} produk berhasil diimport (${products.length - validProducts.length} data diabaikan karena tidak valid)`,
      data,
    })
  } catch (error) {
    console.error("Error processing import:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}