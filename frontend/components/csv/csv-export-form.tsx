 "use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// TODO: Implement export functionality
export function CsvExportForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Results</CardTitle>
        <CardDescription>Export call results and analytics for your campaigns.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Select Campaign</Label>
          {/* TODO: Populate with real campaigns */}
          <Select defaultValue="march">
            <SelectTrigger>
              <SelectValue placeholder="Select campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="march">March Invoices</SelectItem>
              <SelectItem value="april">April Invoices</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Export Format</Label>
          <Select defaultValue="csv">
            <SelectTrigger>
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Data to Include</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="include-calls"
                className="h-4 w-4 rounded border-gray-300"
                defaultChecked
              />
              <Label htmlFor="include-calls" className="text-sm font-normal">
                Call Details
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="include-transcripts"
                className="h-4 w-4 rounded border-gray-300"
                defaultChecked
              />
              <Label htmlFor="include-transcripts" className="text-sm font-normal">
                Transcripts
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="include-payments"
                className="h-4 w-4 rounded border-gray-300"
                defaultChecked
              />
              <Label htmlFor="include-payments" className="text-sm font-normal">
                Payment Status
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="include-analytics"
                className="h-4 w-4 rounded border-gray-300"
                defaultChecked
              />
              <Label htmlFor="include-analytics" className="text-sm font-normal">
                Analytics
              </Label>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" disabled>Export Data</Button> {/* Disabled until implemented */}
      </CardFooter>
    </Card>
  )
} 