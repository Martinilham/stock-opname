import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

type StockCount = {
  id: string
  location_id: string
  barcode: string
  product_name: string
  uom: string
  selling_price: number
  count: number
  counted_at: string
}

type LocationWithCounts = {
  id: string
  name: string
  description: string | null
  pic_name: string | null
  created_at: string
  stockCounts: StockCount[]
  totalItems: number
}

export async function POST(request: Request) {
  try {
    const { location, format } = await request.json() as { location: LocationWithCounts; format: "csv" | "xlsx" }

    if (format === "csv") {
      return exportToCSV(location)
    } else {
      return exportToXLSX(location)
    }
  } catch (error) {
    console.error("Error exporting:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

function exportToCSV(location: LocationWithCounts) {
  // CSV Header
  const headers = ["Barcode", "Product Name", "UOM", "Selling Price", "Count", "Counted At"]
  const csvRows = [headers.join(",")]

  // CSV Data
  location.stockCounts.forEach((sc) => {
    const row = [
      sc.barcode,
      `"${sc.product_name}"`,
      sc.uom,
      sc.selling_price,
      sc.count,
      new Date(sc.counted_at).toLocaleString("id-ID"),
    ]
    csvRows.push(row.join(","))
  })

  // Add summary row
  csvRows.push("")
  csvRows.push(`PIC Name,${location.pic_name || "-"}`)
  csvRows.push(`Location,${location.name}`)
  csvRows.push(`Total Products,${location.stockCounts.length}`)
  csvRows.push(`Total Items,${location.totalItems}`)

  const csvContent = csvRows.join("\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })

  return new NextResponse(blob, {
    headers: {
      "Content-Type": "text/csv;charset=utf-8;",
      "Content-Disposition": `attachment; filename="stock-count-${location.name.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  })
}

function exportToXLSX(location: LocationWithCounts) {
  const exportData = location.stockCounts.map((sc) => ({
    Barcode: sc.barcode,
    "Nama Produk": sc.product_name,
    UOM: sc.uom,
    "Harga Jual": sc.selling_price,
    Jumlah: sc.count,
    "Tanggal Hitung": new Date(sc.counted_at).toLocaleString("id-ID"),
  }))

  const wb = XLSX.utils.book_new()

  // Sheet data detail
  const wsDetail = XLSX.utils.json_to_sheet(exportData)
  XLSX.utils.book_append_sheet(wb, wsDetail, "Stock Count")

  // Sheet summary
  const wsSummary = XLSX.utils.json_to_sheet([
    { Kategori: "Lokasi", Nilai: location.name },
    { Kategori: "PIC Name", Nilai: location.pic_name || "-" },
    { Kategori: "Total Produk", Nilai: location.stockCounts.length },
    { Kategori: "Total Item", Nilai: location.totalItems },
    { Kategori: "Tanggal Export", Nilai: new Date().toLocaleString("id-ID") },
  ])
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary")

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
  const buffer = Buffer.from(wbout)

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="stock-count-${location.name.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.xlsx"`,
    },
  })
}