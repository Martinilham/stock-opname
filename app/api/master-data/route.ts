import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { barcode, product_name, uom, selling_price } = await request.json()
    const supabase = await createClient()

    // Validasi input
    if (!barcode || !product_name || !uom || !selling_price) {
      return NextResponse.json({ message: "Semua field harus diisi" }, { status: 400 })
    }

    if (selling_price <= 0) {
      return NextResponse.json({ message: "Harga harus lebih dari 0" }, { status: 400 })
    }

    // Cek duplikat barcode
    const { data: existingProduct, error: checkError } = await supabase
      .from("master_products")
      .select("id")
      .eq("barcode", barcode)
      .single()

    if (existingProduct) {
      return NextResponse.json(
        { message: "Barcode sudah terdaftar di sistem" },
        { status: 400 }
      )
    }

    // Insert data baru
    const { data, error } = await supabase
      .from("master_products")
      .insert({
        barcode,
        product_name,
        uom,
        selling_price,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating product:", error)
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}