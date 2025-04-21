"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CsvUploadForm } from "./csv-upload-form"
import { CsvUploadHistory } from "./csv-upload-history"
import { CsvExportForm } from "./csv-export-form"

export function CsvUpload() {
  return (
    <Tabs defaultValue="upload" className="space-y-4">
      <TabsList>
        <TabsTrigger value="upload">Upload CSV</TabsTrigger>
        <TabsTrigger value="history">Upload History</TabsTrigger>
        <TabsTrigger value="export">Export Results</TabsTrigger>
      </TabsList>

      <TabsContent value="upload">
        <CsvUploadForm />
      </TabsContent>

      <TabsContent value="history">
        <CsvUploadHistory />
      </TabsContent>

      <TabsContent value="export">
        <CsvExportForm />
      </TabsContent>
    </Tabs>
  )
}
