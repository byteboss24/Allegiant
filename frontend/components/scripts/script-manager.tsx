"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ScriptManager() {
  const [selectedScript, setSelectedScript] = useState(scripts[0])

  return (
    <Tabs defaultValue="editor" className="space-y-4">
      <TabsList>
        <TabsTrigger value="editor">Script Editor</TabsTrigger>
        <TabsTrigger value="templates">Templates</TabsTrigger>
        <TabsTrigger value="variables">Variables</TabsTrigger>
      </TabsList>

      <TabsContent value="editor">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Script Library</CardTitle>
              <CardDescription>Select a script to edit or create a new one</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input placeholder="Search scripts..." />
              </div>

              <div className="space-y-2">
                {scripts.map((script) => (
                  <div
                    key={script.id}
                    className={`p-3 rounded-md cursor-pointer flex justify-between items-center ${selectedScript.id === script.id ? "bg-muted" : "hover:bg-muted/50"}`}
                    onClick={() => setSelectedScript(script)}
                  >
                    <div>
                      <p className="font-medium">{script.name}</p>
                      <p className="text-xs text-muted-foreground">{script.description}</p>
                    </div>
                    <Badge variant={script.active ? "default" : "outline"}>{script.active ? "Active" : "Draft"}</Badge>
                  </div>
                ))}
              </div>

              <Button className="w-full">Create New Script</Button>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Edit Script</CardTitle>
                  <CardDescription>
                    {selectedScript.name} - {selectedScript.description}
                  </CardDescription>
                </div>
                <Badge variant={selectedScript.active ? "default" : "outline"}>
                  {selectedScript.active ? "Active" : "Draft"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="script-name">Script Name</Label>
                <Input id="script-name" defaultValue={selectedScript.name} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="script-description">Description</Label>
                <Input id="script-description" defaultValue={selectedScript.description} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="voice-selection">Voice Selection</Label>
                <Select defaultValue="sarah">
                  <SelectTrigger>
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sarah">Sarah (British Female)</SelectItem>
                    <SelectItem value="james">James (British Male)</SelectItem>
                    <SelectItem value="emma">Emma (British Female - Formal)</SelectItem>
                    <SelectItem value="david">David (British Male - Formal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="script-content">Script Content</Label>
                  <Button variant="ghost" size="sm">
                    Insert Variable
                  </Button>
                </div>
                <Textarea
                  id="script-content"
                  className="min-h-[300px] font-mono text-sm"
                  defaultValue={selectedScript.content}
                />
              </div>

              <div className="space-y-2">
                <Label>Conversation Flow</Label>
                <div className="rounded-md border p-4">
                  <div className="space-y-4">
                    {selectedScript.flow.map((step, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs flex-shrink-0 mt-1">
                          {index + 1}
                        </div>
                        <div className="space-y-1 flex-1">
                          <p className="font-medium">{step.title}</p>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                          <div className="flex gap-2 mt-1">
                            {step.actions.map((action, actionIndex) => (
                              <Badge key={actionIndex} variant="outline" className="text-xs">
                                {action}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Cancel</Button>
              <div className="flex gap-2">
                <Button variant="outline">Test Script</Button>
                <Button>Save Changes</Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="templates">
        <Card>
          <CardHeader>
            <CardTitle>Script Templates</CardTitle>
            <CardDescription>Pre-defined templates to help you get started quickly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="overflow-hidden">
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {template.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">{template.preview}</p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button variant="outline" className="w-full">
                      Use Template
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="variables">
        <Card>
          <CardHeader>
            <CardTitle>Script Variables</CardTitle>
            <CardDescription>Manage the variables that can be used in your scripts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left font-medium">Variable Name</th>
                    <th className="p-3 text-left font-medium">Description</th>
                    <th className="p-3 text-left font-medium">Source</th>
                    <th className="p-3 text-left font-medium">Example</th>
                  </tr>
                </thead>
                <tbody>
                  {variables.map((variable) => (
                    <tr key={variable.id} className="border-b">
                      <td className="p-3 font-mono text-sm">{variable.name}</td>
                      <td className="p-3">{variable.description}</td>
                      <td className="p-3">{variable.source}</td>
                      <td className="p-3 font-mono text-sm">{variable.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <Button>Add New Variable</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

const scripts = [
  {
    id: "1",
    name: "Allegiant Finance Services - Credit Control",
    description: "Official script for Allegiant Finance Services invoice collection",
    active: true,
    content: `Hello, my name is Emma calling from Allegiant Finance Services Ltd, an FCA-regulated claims management company. Am I speaking with {{customer_name}}?

[Customer identification]

Thank you {{customer_first_name}} for confirming. I'm calling regarding an invoice for our claims management services. Please can you confirm whether you have received this payment from {{lender_name}}?

[If customer confirms they have received payment]
Thank you for confirming. That's great to hear. We are glad we could assist. As per our no win, no fee agreement with you, our fee of {{invoice_amount}} is now due. Are you in a position to make this payment today?

[If customer confirms they have received payment AND invoice is over 30 days old]
Thank you for confirming. According to our records, the invoice amount is {{invoice_amount}} which is due upon receiving your compensation payment. As the invoice was generated over 30 days ago, we would appreciate arranging payment today if possible to avoid escalation. Would you be in a position to make this payment now?

[If customer indicates they have NOT received payment]
I understand you haven't received your compensation payment yet. Thank you for letting me know. I'll make a note of this and have our credit control team check the status of your compensation payment with {{lender_name}}. Is this the best number for the team to reach you on?`,
    flow: [
      {
        title: "Introduction",
        description: "Introduce as Emma from Allegiant Finance Services Ltd and confirm customer identity",
        actions: ["Confirmation"],
      },
      {
        title: "Payment Confirmation",
        description: "Verify if customer has received compensation payment",
        actions: ["Information", "Question"],
      },
      {
        title: "Payment Collection",
        description: "Request payment based on customer's situation",
        actions: ["Transfer", "SMS", "Follow-up"],
      },
      {
        title: "Vulnerability Handling",
        description: "Identify and appropriately respond to customer vulnerability",
        actions: ["Transfer", "Support"],
      },
      {
        title: "Conclusion",
        description: "End call appropriately based on outcome",
        actions: ["Closing"],
      },
    ],
  },
  {
    id: "2",
    name: "Gentle Reminder",
    description: "Softer approach for first follow-up",
    active: false,
    content: "Script content here...",
    flow: [
      {
        title: "Introduction",
        description: "Introduce yourself and confirm customer identity",
        actions: ["Confirmation"],
      },
      {
        title: "Friendly Reminder",
        description: "Gently remind about the outstanding invoice",
        actions: ["Information"],
      },
      {
        title: "Payment Options",
        description: "Offer flexible payment methods",
        actions: ["Transfer", "SMS", "Schedule"],
      },
      {
        title: "Conclusion",
        description: "Thank the customer and end the call appropriately",
        actions: ["Closing"],
      },
    ],
  },
  {
    id: "3",
    name: "Urgent Payment",
    description: "For overdue invoices requiring immediate attention",
    active: false,
    content: "Script content here...",
    flow: [
      {
        title: "Introduction",
        description: "Introduce yourself and confirm customer identity",
        actions: ["Confirmation"],
      },
      {
        title: "Urgent Notice",
        description: "Explain the urgency of the payment",
        actions: ["Information", "Urgency"],
      },
      {
        title: "Payment Options",
        description: "Offer immediate payment methods",
        actions: ["Transfer", "SMS"],
      },
      {
        title: "Conclusion",
        description: "Thank the customer and end the call appropriately",
        actions: ["Closing"],
      },
    ],
  },
]

const templates = [
  {
    id: "1",
    name: "Allegiant Standard Collection",
    description: "Official Allegiant Finance Services script",
    tags: ["Invoice", "Payment", "Allegiant", "FCA-Regulated"],
    preview:
      "Hello, my name is Emma calling from Allegiant Finance Services Ltd, an FCA-regulated claims management company. Am I speaking with [Customer Name]?",
  },
  {
    id: "2",
    name: "Gentle Reminder",
    description: "Soft approach for first contact",
    tags: ["Friendly", "First Contact", "Reminder"],
    preview:
      "Hello, my name is Emma from Allegiant Finance Services. I hope you're having a good day. I'm just calling with a friendly reminder about an outstanding invoice.",
  },
  {
    id: "3",
    name: "30+ Days Overdue",
    description: "For invoices over 30 days old",
    tags: ["Overdue", "Urgent", "30+ Days"],
    preview:
      "Hello, my name is Emma from Allegiant Finance Services. I'm calling regarding your outstanding invoice which is now over 30 days old and requires attention.",
  },
  {
    id: "4",
    name: "Payment Plan Offer",
    description: "For offering payment plans",
    tags: ["Payment Plan", "Flexible", "Options"],
    preview:
      "Hello, my name is Emma from Allegiant Finance Services. I'm calling to discuss some flexible payment options for your outstanding invoice.",
  },
  {
    id: "5",
    name: "Follow-up Call",
    description: "For following up on previous conversations",
    tags: ["Follow-up", "Reminder", "Previous Contact"],
    preview:
      "Hello, my name is Emma from Allegiant Finance Services. I'm calling to follow up on our previous conversation about your outstanding invoice.",
  },
]

const variables = [
  {
    id: "1",
    name: "{{customer_name}}",
    description: "Customer's full name",
    source: "CSV Upload",
    example: "John Smith",
  },
  {
    id: "2",
    name: "{{customer_first_name}}",
    description: "Customer's first name only",
    source: "CSV Upload",
    example: "John",
  },
  {
    id: "3",
    name: "{{invoice_number}}",
    description: "Invoice reference number",
    source: "CSV Upload",
    example: "INV-2023-0421",
  },
  {
    id: "4",
    name: "{{lender_name}}",
    description: "Name of the lender who paid compensation",
    source: "CSV Upload",
    example: "Barclays Bank",
  },
  {
    id: "5",
    name: "{{invoice_amount}}",
    description: "Outstanding invoice amount",
    source: "CSV Upload",
    example: "£245.00",
  },
  {
    id: "6",
    name: "{{invoice_date}}",
    description: "Date invoice was generated",
    source: "CSV Upload",
    example: "2023-03-15",
  },
  {
    id: "7",
    name: "{{payment_url}}",
    description: "Payment link URL",
    source: "CSV Upload",
    example: "https://pay.example.com/inv/12345",
  },
  {
    id: "8",
    name: "{{percentage}}",
    description: "Fee percentage of compensation",
    source: "CSV Upload",
    example: "24%",
  },
]

