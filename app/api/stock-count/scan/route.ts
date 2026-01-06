import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { locationId, barcode } = await request.json()
    const supabase = await createClient()

    // Find the product in master data
    const { data: product, error: productError } = await supabase
      .from("master_products")
      .select("*")
      .eq("barcode", barcode)
      .single()

    if (productError || !product) {
      return NextResponse.json({ message: "Produk tidak ditemukan di master data" }, { status: 404 })
    }

    // Check if this barcode already exists in stock_counts for this location
    const { data: existingCount } = await supabase
      .from("stock_counts")
      .select("*")
      .eq("location_id", locationId)
      .eq("barcode", barcode)
      .single()

    if (existingCount) {
      // Update count
      const { data, error } = await supabase
        .from("stock_counts")
        .update({
          count: existingCount.count + 1,
          counted_at: new Date().toISOString(),
        })
        .eq("id", existingCount.id)
        .select()
        .single()

      if (error) {
        console.error("Error updating stock count:", error)
        return NextResponse.json({ message: error.message }, { status: 400 })
      }

      return NextResponse.json({ success: true, data })
    } else {
      // Insert new count
      const { data, error } = await supabase
        .from("stock_counts")
        .insert({
          location_id: locationId,
          barcode: product.barcode,
          product_name: product.product_name,
          uom: product.uom,
          selling_price: product.selling_price,
          count: 1,
        })
        .select()
        .single()

      if (error) {
        console.error("Error inserting stock count:", error)
        return NextResponse.json({ message: error.message }, { status: 400 })
      }

      return NextResponse.json({ success: true, data })
    }
  } catch (error) {
    console.error("Error processing scan:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
