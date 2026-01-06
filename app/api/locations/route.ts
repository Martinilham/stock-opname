import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { pic_name, name, description } = await request.json()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("locations")
      .insert({
        pic_name,
        name,
        description,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating location:", error)
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error processing location creation:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
