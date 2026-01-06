"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Upload, ArrowLeft, Trash2, ChevronLeft, ChevronRight, Search, X, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type Product = {
  id: string
  barcode: string
  product_name: string
  uom: string
  selling_price: number
  created_at: string
}

const ITEMS_PER_PAGE = 50

export function MasterDataClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [isUploading, setIsUploading] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    barcode: "",
    product_name: "",
    uom: "",
    selling_price: "",
  })
  const router = useRouter()

  // Filter produk berdasarkan search term
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) {
      return products
    }

    const lowerSearchTerm = searchTerm.toLowerCase()
    return products.filter(
      (product) =>
        product.barcode.toLowerCase().includes(lowerSearchTerm) ||
        product.product_name.toLowerCase().includes(lowerSearchTerm)
    )
  }, [products, searchTerm])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      const text = await file.text()
      const lines = text.split("\n").filter((line) => line.trim())

      if (lines.length < 2) {
        alert("File CSV kosong atau tidak valid")
        setIsUploading(false)
        return
      }

      const headers = lines[0].toLowerCase().split(",").map((h) => h.trim())

      const barcodeIndex = headers.findIndex((h) => h.includes("barcode"))
      const productNameIndex = headers.findIndex((h) => h.includes("productname") || h.includes("product_name"))
      const uomIndex = headers.findIndex((h) => h.includes("uom"))
      const priceIndex = headers.findIndex((h) => h.includes("sellingprice") || h.includes("selling_price") || h.includes("price"))

      if (barcodeIndex === -1 || productNameIndex === -1 || uomIndex === -1 || priceIndex === -1) {
        alert(`Format CSV tidak valid. Ditemukan headers: ${headers.join(", ")}`)
        setIsUploading(false)
        return
      }

      const productsToImport = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""))

        return {
          barcode: values[barcodeIndex],
          product_name: values[productNameIndex],
          uom: values[uomIndex],
          selling_price: parseInt(values[priceIndex], 10),
        }
      })

      const response = await fetch("/api/master-data/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: productsToImport }),
      })

      if (response.ok) {
        alert("Data berhasil diimport!")
        router.refresh()
      } else {
        const error = await response.json()
        alert(`Error: ${error.message}`)
      }
    } catch (error) {
      console.error("Error importing file:", error)
      alert("Gagal mengimport file")
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.barcode.trim() || !formData.product_name.trim() || !formData.uom.trim() || !formData.selling_price.trim()) {
      alert("Semua field harus diisi")
      return
    }

    const sellingPrice = parseInt(formData.selling_price, 10)
    if (isNaN(sellingPrice) || sellingPrice <= 0) {
      alert("Harga harus berupa angka positif")
      return
    }

    setIsCreating(true)

    try {
      const response = await fetch("/api/master-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcode: formData.barcode.trim(),
          product_name: formData.product_name.trim(),
          uom: formData.uom.trim(),
          selling_price: sellingPrice,
        }),
      })

      if (response.ok) {
        const { data } = await response.json()
        setProducts([data, ...products])
        setFormData({ barcode: "", product_name: "", uom: "", selling_price: "" })
        setIsDialogOpen(false)
        alert("Data produk berhasil ditambahkan!")
      } else {
        const error = await response.json()
        alert(`Error: ${error.message}`)
      }
    } catch (error) {
      console.error("Error adding product:", error)
      alert("Gagal menambahkan produk")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return

    const response = await fetch(`/api/master-data/${id}`, {
      method: "DELETE",
    })

    if (response.ok) {
      setProducts(products.filter((p) => p.id !== id))
    }
  }

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const startIndex = currentPage * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  // Reset ke halaman 1 saat search berubah
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(0)
  }

  const clearSearch = () => {
    setSearchTerm("")
    setCurrentPage(0)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Import Data Master</CardTitle>
          <CardDescription>
            Upload file CSV atau Excel dengan kolom: Barcode, ProductName, UOM, Selling Price
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Input
              id="file-upload"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="max-w-md"
            />
            <Button disabled={isUploading} style={{ backgroundColor: "#0db04b", color: "white" }}>
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? "Uploading..." : "Upload File"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Data Produk ({filteredProducts.length})</CardTitle>
              <CardDescription>Total semua data: {products.length} produk</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button style={{ backgroundColor: "#0db04b", color: "white" }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Data Master
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Data Produk Baru</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="barcode">Barcode</Label>
                    <Input
                      id="barcode"
                      placeholder="Contoh: 8992772586023"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      disabled={isCreating}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="product_name">Nama Produk</Label>
                    <Input
                      id="product_name"
                      placeholder="Contoh: ADEM SARI CHINGKU HERBAL TEA CAN 320ML"
                      value={formData.product_name}
                      onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                      disabled={isCreating}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uom">UOM</Label>
                    <Input
                      id="uom"
                      placeholder="Contoh: PCS, BOX, KG"
                      value={formData.uom}
                      onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                      disabled={isCreating}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="selling_price">Harga Jual</Label>
                    <Input
                      id="selling_price"
                      type="number"
                      placeholder="Contoh: 7900"
                      value={formData.selling_price}
                      onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                      disabled={isCreating}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isCreating} style={{ backgroundColor: "#0db04b", color: "white" }}>
                    {isCreating ? "Menyimpan..." : "Simpan Produk"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan barcode atau nama produk..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Results info */}
          {searchTerm && (
            <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">
              Menampilkan {filteredProducts.length} dari {products.length} produk
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead>UOM</TableHead>
                  <TableHead className="text-right">Harga Jual</TableHead>
                  <TableHead className="w-25">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      {searchTerm ? "Produk tidak ditemukan" : "Belum ada data produk. Silakan import data master."}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono">{product.barcode}</TableCell>
                      <TableCell>{product.product_name}</TableCell>
                      <TableCell>{product.uom}</TableCell>
                      <TableCell className="text-right">Rp {product.selling_price.toLocaleString("id-ID")}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product.id)}
                          style={{ color: "#EF4444" }}
                          className="hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                Halaman {currentPage + 1} dari {totalPages} (Total: {filteredProducts.length} produk)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                >
                  Selanjutnya
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}