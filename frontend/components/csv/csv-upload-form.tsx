"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { uploadCsv } from "@/lib/apis"

export function CsvUploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[] | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [campaignName, setCampaignName] = useState("")
  const [selectedScript, setSelectedScript] = useState("default")
  const [selectedPhoneStrategy, setSelectedPhoneStrategy] = useState("random")
  const { toast } = useToast()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      
      // Validate file type
      if (!selectedFile.name.endsWith('.csv')) {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV file",
          variant: "destructive",
        })
        return
      }

      // Validate file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 10MB",
          variant: "destructive",
        })
        return
      }

      setFile(selectedFile)
      
      // Preview CSV data
      try {
        const text = await selectedFile.text()
        const rows = text.split('\n').filter(row => row.trim())
        if (rows.length < 2) {
          throw new Error("CSV file must contain at least a header row and one data row")
        }

        const headers = rows[0].split(',').map(h => h.trim())
        const requiredHeaders = ['name', 'phone', 'outstanding_amount']
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
        
        if (missingHeaders.length > 0) {
          throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`)
        }

        const previewData = rows.slice(1, 4).map(row => {
          const values = row.split(',').map(v => v.trim())
          return headers.reduce((obj, header, index) => {
            obj[header] = values[index] || ''
            return obj
          }, {} as Record<string, string>)
        })

        // Validate preview data
        const invalidRows = previewData.filter(row => 
          !row.name || !row.phone || !row.outstanding_amount
        )

        if (invalidRows.length > 0) {
          throw new Error("Some rows are missing required fields")
        }

        setPreview(previewData)
      } catch (error) {
        toast({
          title: "Error reading file",
          description: error instanceof Error ? error.message : "Could not read the CSV file. Please check the format.",
          variant: "destructive",
        })
        setFile(null)
        setPreview(null)
      }
    }
  }

  const handleUpload = async () => {
    if (!file || !campaignName) {
      toast({
        title: "Missing information",
        description: "Please provide both a file and campaign name",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('campaign_name', campaignName)
    formData.append('script', selectedScript)
    formData.append('phone_strategy', selectedPhoneStrategy)

    try {
      const data = await uploadCsv(formData)

      toast({
        title: "Upload successful",
        description: `Processed ${data.total_records} records. ${data.successful_records} successful, ${data.failed_records} failed.`,
      })

      if (data.errors && data.errors.length > 0) {
        // Show errors in a more user-friendly way
        const errorMessage = data.errors.length > 3 
          ? `${data.errors.length} errors occurred. Check the console for details.`
          : data.errors.join('\n')
        
        toast({
          title: "Some records failed",
          description: errorMessage,
          variant: "destructive",
        })
        console.error('Upload errors:', data.errors)
      }

      // Reset form
      setFile(null)
      setPreview(null)
      setCampaignName("")
      setSelectedScript("default")
      setSelectedPhoneStrategy("random")
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred during upload",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Customer Data</CardTitle>
        <CardDescription>
          Upload a CSV file containing customer information for your calling campaign.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="campaign-name">Campaign Name</Label>
          <Input 
            id="campaign-name" 
            placeholder="Enter campaign name" 
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="csv-file">CSV File</Label>
          <div className="grid w-full items-center gap-1.5">
            <Label
              htmlFor="csv-file"
              className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-input bg-background p-4 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <div className="flex flex-col items-center justify-center space-y-2 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" x2="12" y1="3" y2="15" />
                </svg>
                <div className="text-sm">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </div>
                <p className="text-xs text-muted-foreground">CSV (MAX. 10MB)</p>
              </div>
            </Label>
            <Input id="csv-file" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Script Selection</Label>
          <Select value={selectedScript} onValueChange={setSelectedScript}>
            <SelectTrigger>
              <SelectValue placeholder="Select a script" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default Invoice Collection</SelectItem>
              <SelectItem value="gentle">Gentle Reminder</SelectItem>
              <SelectItem value="urgent">Urgent Payment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Phone Number Selection</Label>
          <Select value={selectedPhoneStrategy} onValueChange={setSelectedPhoneStrategy}>
            <SelectTrigger>
              <SelectValue placeholder="Select phone number strategy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="random">Random from Pool</SelectItem>
              <SelectItem value="fixed">Fixed Number</SelectItem>
              <SelectItem value="geo">Geo-Matched</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {preview && (
          <div className="space-y-2 pt-4">
            <h3 className="text-lg font-medium">Data Preview</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {Object.keys(preview[0]).map((header) => (
                    <TableHead key={header}>{header}</TableHead>
                  ))}
                </TableHeader>
                <TableBody>
                  {preview.map((row, i) => (
                    <TableRow key={i}>
                      {Object.values(row).map((value, j) => (
                        <TableCell key={j}>{String(value)}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => {
            setFile(null)
            setPreview(null)
            setCampaignName("")
            setSelectedScript("default")
            setSelectedPhoneStrategy("random")
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleUpload} 
          disabled={isUploading || !file || !campaignName}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            'Start Campaign'
          )}
        </Button>
      </CardFooter>
    </Card>
  )
} 