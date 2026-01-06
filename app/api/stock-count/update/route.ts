import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { stockCountId, count } = await request.json()
    const supabase = await createClient()

    if (count === 0) {
      // Delete if count is 0
      const { error } = await supabase.from("stock_counts").delete().eq("id", stockCountId)

      if (error) {
        return NextResponse.json({ message: error.message }, { status: 400 })
      }

      return NextResponse.json({ success: true, deleted: true })
    } else {
      // Update count
      const { data, error } = await supabase
        .from("stock_counts")
        .update({ count })
        .eq("id", stockCountId)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ message: error.message }, { status: 400 })
      }

      return NextResponse.json({ success: true, data })
    }
  } catch (error) {
    console.error("Error updating stock count:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
