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
    const { locations, format } = await request.json() as { locations: LocationWithCounts[]; format: "csv" | "xlsx" }

    if (format === "csv") {
      return exportAllToCSV(locations)
    } else {
      return exportAllToXLSX(locations)
    }
  } catch (error) {
    console.error("Error exporting:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

function exportAllToCSV(locations: LocationWithCounts[]) {
  const headers = ["Location", "PIC Name", "Barcode", "Product Name", "UOM", "Selling Price", "Count", "Counted At"]
  const csvRows = [headers.join(",")]

  // CSV Data
  locations.forEach((location) => {
    location.stockCounts.forEach((sc) => {
      const row = [
        `"${location.name}"`,
        location.pic_name || "-",
        sc.barcode,
        `"${sc.product_name}"`,
        sc.uom,
        sc.selling_price,
        sc.count,
        new Date(sc.counted_at).toLocaleString("id-ID"),
      ]
      csvRows.push(row.join(","))
    })
  })

  // Add summary
  csvRows.push("")
  csvRows.push("Summary by Location")
  locations.forEach((location) => {
    csvRows.push(
      `"${location.name}","${location.pic_name || "-"}",${location.stockCounts.length} products,${location.totalItems} items`,
    )
  })

  const totalProducts = locations.reduce((sum, loc) => sum + loc.stockCounts.length, 0)
  const totalItems = locations.reduce((sum, loc) => sum + loc.totalItems, 0)
  csvRows.push("")
  csvRows.push(`Grand Total,${totalProducts} products,${totalItems} items`)

  const csvContent = csvRows.join("\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })

  return new NextResponse(blob, {
    headers: {
      "Content-Type": "text/csv;charset=utf-8;",
      "Content-Disposition": `attachment; filename="stock-count-all-locations-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  })
}

function exportAllToXLSX(locations: LocationWithCounts[]) {
  const wb = XLSX.utils.book_new()

  // Create sheet for each location
  locations.forEach((location) => {
    const exportData = location.stockCounts.map((sc) => ({
      Barcode: sc.barcode,
      "Nama Produk": sc.product_name,
      UOM: sc.uom,
      "Harga Jual": sc.selling_price,
      Jumlah: sc.count,
      "Tanggal Hitung": new Date(sc.counted_at).toLocaleString("id-ID"),
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    XLSX.utils.book_append_sheet(wb, ws, location.name.substring(0, 31))
  })

  // Summary sheet
  const summaryData = locations.map((loc) => ({
    Lokasi: loc.name,
    PIC: loc.pic_name || "-",
    "Total Produk": loc.stockCounts.length,
    "Total Item": loc.totalItems,
  }))

  const totalProducts = locations.reduce((sum, loc) => sum + loc.stockCounts.length, 0)
  const totalItems = locations.reduce((sum, loc) => sum + loc.totalItems, 0)

  summaryData.push({
    Lokasi: "GRAND TOTAL",
    PIC: "",
    "Total Produk": totalProducts,
    "Total Item": totalItems,
  })

  const wsSummary = XLSX.utils.json_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary")

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
  const buffer = Buffer.from(wbout)

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="stock-count-all-locations-${new Date().toISOString().split("T")[0]}.xlsx"`,
    },
  })
}