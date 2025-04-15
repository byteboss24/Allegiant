import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CallRecordingsLoading() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Call Recordings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Loading Call Recordings</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-12">
          <Spinner size="lg" />
        </CardContent>
      </Card>
    </div>
  )
} 