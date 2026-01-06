"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Download, FileSpreadsheet, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

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

const ITEMS_PER_PAGE = 5

export function ExportClient({ locations }: { locations: LocationWithCounts[] }) {
  const [currentPage, setCurrentPage] = useState<{ [key: string]: number }>({})
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportType, setExportType] = useState<"single" | "all" | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<LocationWithCounts | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const getCurrentPage = (locationId: string) => {
    return currentPage[locationId] || 0
  }

  const setCurrentPageForLocation = (locationId: string, page: number) => {
    setCurrentPage((prev) => ({
      ...prev,
      [locationId]: page,
    }))
  }

  const getPaginatedItems = (locationId: string, items: StockCount[]) => {
    const page = getCurrentPage(locationId)
    const start = page * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    return items.slice(start, end)
  }

  const getTotalPages = (itemsLength: number) => {
    return Math.ceil(itemsLength / ITEMS_PER_PAGE)
  }

  const openExportDialog = (type: "single" | "all", location?: LocationWithCounts) => {
    setExportType(type)
    if (type === "single" && location) {
      setSelectedLocation(location)
    }
    setShowExportDialog(true)
  }

  const handleExport = async (format: "csv" | "xlsx") => {
    setIsExporting(true)
    try {
      if (exportType === "single" && selectedLocation) {
        await exportSingleLocation(selectedLocation, format)
      } else if (exportType === "all") {
        await exportAllLocations(format)
      }
      setShowExportDialog(false)
      setExportType(null)
      setSelectedLocation(null)
    } finally {
      setIsExporting(false)
    }
  }

  const exportSingleLocation = async (location: LocationWithCounts, format: "csv" | "xlsx") => {
    if (location.stockCounts.length === 0) {
      alert("Tidak ada data untuk diexport")
      return
    }

    try {
      const response = await fetch("/api/stock-count/export-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location,
          format,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `stock-count-${location.name.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert("Gagal export data")
      }
    } catch (error) {
      console.error("Error exporting:", error)
      alert("Terjadi kesalahan saat export")
    }
  }

  const exportAllLocations = async (format: "csv" | "xlsx") => {
    const allCounts = locations.flatMap((loc) => loc.stockCounts)

    if (allCounts.length === 0) {
      alert("Tidak ada data untuk diexport")
      return
    }

    try {
      const response = await fetch("/api/stock-count/export-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locations,
          format,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `stock-count-all-locations-${new Date().toISOString().split("T")[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert("Gagal export data")
      }
    } catch (error) {
      console.error("Error exporting:", error)
      alert("Terjadi kesalahan saat export")
    }
  }

  const totalAllProducts = locations.reduce((sum, loc) => sum + loc.stockCounts.length, 0)
  const totalAllItems = locations.reduce((sum, loc) => sum + loc.totalItems, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </Link>

        {locations.length > 0 && (
          <Button 
            onClick={() => openExportDialog("all")} 
            size="lg" 
            style={{ backgroundColor: "#0db04b", color: "white" }}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Semua Lokasi
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Total perhitungan stok dari semua lokasi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Badge variant="secondary" className="text-base px-2 py-2">
              Total Produk: {totalAllProducts}
            </Badge>
            <Badge variant="secondary" className="text-base px-2 py-2">
              Total Item: {totalAllItems}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {locations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileSpreadsheet className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Belum ada data stock count untuk diexport.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {locations.map((location) => {
            const totalPages = getTotalPages(location.stockCounts.length)
            const currentPageNum = getCurrentPage(location.id)
            const paginatedItems = getPaginatedItems(location.id, location.stockCounts)

            return (
              <Card key={location.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{location.name}</CardTitle>
                      {location.pic_name && (
                        <CardDescription className="mt-2">PIC: {location.pic_name}</CardDescription>
                      )}
                      {location.description && <CardDescription>{location.description}</CardDescription>}
                    </div>
                    <Button 
                      onClick={() => openExportDialog("single", location)} 
                      disabled={location.stockCounts.length === 0} 
                      style={{ backgroundColor: "#0db04b", color: "white" }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export Lokasi Ini
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex gap-4">
                    <Badge variant="secondary">Produk: {location.stockCounts.length}</Badge>
                    <Badge variant="secondary">Total Item: {location.totalItems}</Badge>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Barcode</TableHead>
                          <TableHead>Nama Produk</TableHead>
                          <TableHead>UOM</TableHead>
                          <TableHead className="text-right">Harga</TableHead>
                          <TableHead className="text-center">Jumlah</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedItems.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                              Belum ada data stock count
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedItems.map((sc) => (
                            <TableRow key={sc.id}>
                              <TableCell className="font-mono">{sc.barcode}</TableCell>
                              <TableCell>{sc.product_name}</TableCell>
                              <TableCell>{sc.uom}</TableCell>
                              <TableCell className="text-right">Rp {sc.selling_price.toLocaleString("id-ID")}</TableCell>
                              <TableCell className="text-center font-semibold">{sc.count}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Halaman {currentPageNum + 1} dari {totalPages} (Total: {location.stockCounts.length} item)
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPageForLocation(location.id, currentPageNum - 1)}
                          disabled={currentPageNum === 0}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPageForLocation(location.id, currentPageNum + 1)}
                          disabled={currentPageNum === totalPages - 1}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pilih Format Export</DialogTitle>
            <DialogDescription>
              {exportType === "single" 
                ? `Pilih format untuk export "${selectedLocation?.name}"`
                : "Pilih format untuk export semua lokasi"
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => handleExport("csv")}
              disabled={isExporting}
              className="flex-1"
            >
              {isExporting ? "Exporting..." : "Export CSV"}
            </Button>
            <Button
              onClick={() => handleExport("xlsx")}
              disabled={isExporting}
              className="flex-1"
              style={{ backgroundColor: "#0db04b", color: "white" }}
            >
              {isExporting ? "Exporting..." : "Export XLSX"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}