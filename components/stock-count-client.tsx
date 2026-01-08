"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, ArrowLeft, FolderOpen, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type Location = {
  id: string
  name: string
  description: string | null
  pic_name: string | null
  created_at: string
}

export function StockCountClient({ initialLocations }: { initialLocations: Location[] }) {
  const [locations, setLocations] = useState<Location[]>(initialLocations)
  // Try to load cached locations from localStorage for faster perceived load
  useEffect(() => {
    try {
      const cached = localStorage.getItem("locations_cache")
      if (cached) {
        const parsed: Location[] = JSON.parse(cached)
        // If we have cached data and initialLocations is empty, use cache
        if ((!initialLocations || initialLocations.length === 0) && parsed.length > 0) {
          setLocations(parsed)
        }
      }
    } catch (e) {
      // ignore
    }
  }, [])

  // Keep cache updated when locations change
  useEffect(() => {
    try {
      localStorage.setItem("locations_cache", JSON.stringify(locations))
    } catch (e) {
      // ignore
    }
  }, [locations])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newLocationName, setNewLocationName] = useState("")
  const [newLocationDesc, setNewLocationDesc] = useState("")
  const [newLocationPIC, setNewLocationPIC] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const response = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pic_name: newLocationPIC,
          name: newLocationName,
          description: newLocationDesc,
        }),
      })

      if (response.ok) {
        const { data } = await response.json()
        setLocations([data, ...locations])
        setNewLocationPIC("")
        setNewLocationName("")
        setNewLocationDesc("")
        setIsDialogOpen(false)
      } else {
        alert("Gagal membuat lokasi")
      }
    } catch (error) {
      console.error("Error creating location:", error)
      alert("Terjadi kesalahan")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus lokasi ini?")) return

    const response = await fetch(`/api/locations/${id}`, {
      method: "DELETE",
    })

    if (response.ok) {
      setLocations(locations.filter((l) => l.id !== id))
    }
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button style={{ backgroundColor: "#0db04b", color: "white" }}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Lokasi
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Lokasi Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateLocation} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pic">Nama PIC</Label>
                <Input
                  id="pic"
                  value={newLocationPIC}
                  onChange={(e) => setNewLocationPIC(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lokasi</Label>
                <Input
                  id="name"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder="Contoh: Gudang A - Rak 1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi (Opsional)</Label>
                <Input
                  id="description"
                  value={newLocationDesc}
                  onChange={(e) => setNewLocationDesc(e.target.value)}
                  placeholder="Deskripsi lokasi"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isCreating} style={{ backgroundColor: "#0db04b", color: "white" }}>
                {isCreating ? "Membuat..." : "Buat Lokasi"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Pilih Lokasi untuk Mulai Scan</h2>
        {locations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <FolderOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Belum ada lokasi. Klik tombol "Tambah Lokasi" untuk membuat lokasi baru.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {locations.map((location) => (
              <Card key={location.id} className="hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5" />
                      <span className="text-lg">{location.name}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(location.id)} style={{ color: "#EF4444" }} className="hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                  {location.description && <CardDescription>{location.description}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <Link href={`/stock-count/scan/${location.id}`}>
                    <Button className="w-full" style={{ backgroundColor: "#0db04b", color: "white" }}>Mulai Scan</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
