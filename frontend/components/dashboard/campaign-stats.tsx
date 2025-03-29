"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export function CampaignStats() {
  return (
    <div className="space-y-4">
      {campaigns.map((campaign) => (
        <Card key={campaign.id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{campaign.name}</h3>
                  <p className="text-sm text-muted-foreground">{campaign.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{campaign.progress}%</p>
                  <p className="text-xs text-muted-foreground">
                    {campaign.completed}/{campaign.total} calls
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <Progress value={campaign.progress} className="h-2" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <p className="font-medium">{campaign.connected}</p>
                  <p className="text-xs text-muted-foreground">Connected</p>
                </div>
                <div>
                  <p className="font-medium">{campaign.transferred}</p>
                  <p className="text-xs text-muted-foreground">Transferred</p>
                </div>
                <div>
                  <p className="font-medium">{campaign.sms}</p>
                  <p className="text-xs text-muted-foreground">SMS Sent</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

const campaigns = [
  {
    id: "1",
    name: "March Invoices",
    description: "Outstanding invoices from March",
    progress: 68,
    completed: 342,
    total: 500,
    connected: 289,
    transferred: 124,
    sms: 165,
  },
  {
    id: "2",
    name: "April Invoices",
    description: "Outstanding invoices from April",
    progress: 42,
    completed: 210,
    total: 500,
    connected: 178,
    transferred: 76,
    sms: 102,
  },
]

