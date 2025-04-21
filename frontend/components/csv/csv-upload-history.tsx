 "use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// TODO: Fetch real data instead of using mock data
const uploadHistory = [
  {
    id: "1",
    date: "2023-05-10",
    campaign: "March Invoices",
    records: 500,
    status: "Completed",
  },
  {
    id: "2",
    date: "2023-05-01",
    campaign: "April Invoices",
    records: 500,
    status: "In Progress",
  },
  {
    id: "3",
    date: "2023-04-15",
    campaign: "February Follow-ups",
    records: 350,
    status: "Completed",
  },
  {
    id: "4",
    date: "2023-04-01",
    campaign: "January Invoices",
    records: 425,
    status: "Completed",
  },
]

export function CsvUploadHistory() {
  // Add state and effects for fetching real data if needed

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload History</CardTitle>
        <CardDescription>View and manage your previous CSV uploads.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead>Records</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {uploadHistory.map((upload) => (
              <TableRow key={upload.id}>
                <TableCell>{upload.date}</TableCell>
                <TableCell>{upload.campaign}</TableCell>
                <TableCell>{upload.records}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      upload.status === "Completed"
                        ? "default"
                        : upload.status === "In Progress"
                          ? "outline"
                          : "secondary"
                    }
                  >
                    {upload.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {/* TODO: Implement View action */}
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
} 