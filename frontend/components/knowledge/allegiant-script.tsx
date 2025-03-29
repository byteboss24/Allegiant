"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function AllegiantScript() {
  const [activeSection, setActiveSection] = useState("opening")

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Allegiant Finance Services – Outbound Credit Control Script</CardTitle>
        <CardDescription>Complete script for Emma, the AI voice agent</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="script" className="space-y-4">
          <TabsList>
            <TabsTrigger value="script">Script Sections</TabsTrigger>
            <TabsTrigger value="tone">Tone Guidelines</TabsTrigger>
            <TabsTrigger value="vulnerability">Vulnerability Handling</TabsTrigger>
          </TabsList>

          <TabsContent value="script" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="opening">
                <AccordionTrigger>Call Opening</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Script:</p>
                    <div className="rounded-md bg-muted p-3 text-sm">
                      "Hello, my name is Emma calling from Allegiant Finance Services Ltd, an FCA-regulated claims
                      management company. Am I speaking with [Customer First Name and Second Name]?"
                    </div>
                    <p className="text-xs text-muted-foreground">
                      NB All future references to the business after "Allegiant Finance Services Limited" should be in
                      first person e.g "we". If using name of company use the shortened name "Allegiant" where full name
                      has already been provided.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="identification">
                <AccordionTrigger>Customer Identification</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Incorrect Person:</p>
                      <div className="rounded-md bg-muted p-3 text-sm">
                        <p>
                          If no, ask the caller's first and last name. Check that it isn't a pronunciation issue. If it
                          is, say "I'm sorry, did I pronounce your name wrong". If yes, continue with new pronunciation
                          and note issue in call summation for future fine tuning.
                        </p>
                        <p className="mt-2">
                          If variation of first name but surname the same, ask if the differing first name is a
                          variation for [Customer First Name]. If customer says yes, confirm if the person is a customer
                          of Allegiant. If they say yes, continue. If they say no, say that you note surname is the
                          same. Please can they provide a different number for [Customer First Name]. Summarise response
                          in call outcome.
                        </p>
                        <p className="mt-2">
                          If variation of second name, ask if customer has changed surname. If so, not new surname.
                        </p>
                        <p className="mt-2">
                          In all cases of variation, ask caller to confirm they are a customer of Allegiant before
                          proceeding.
                        </p>
                        <p className="mt-2">
                          If first and last name are different, ask the customer if they have recently acquired the
                          number, and whether they have an alternative phone number for (customer first name, customer
                          last name). Politely end call by apologising for the interruption and confirming you will ask
                          a colleague to investigate the incorrect phone number.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Correct Person:</p>
                      <div className="rounded-md bg-muted p-3 text-sm">
                        "Thank you (Customer first name) for confirming. I'm calling regarding an invoice for our claims
                        management services. Please can you confirm whether you have received this payment from [Lender
                        Name]?"
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="payment-received">
                <AccordionTrigger>Payment Received Scenarios</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">If customer confirms they have received payment:</p>
                      <div className="rounded-md bg-muted p-3 text-sm">
                        "Thank you for confirming. That's great to hear. We are glad we could assist. As per our no win,
                        no fee agreement with you, our fee of [Invoice Amount] is now due. Are you in a position to make
                        this payment today?"
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        If customer confirms they have received payment AND invoice is over 30 days old:
                      </p>
                      <div className="rounded-md bg-muted p-3 text-sm">
                        "Thank you for confirming. According to our records, the invoice amount is [Amount] which is due
                        upon receiving your compensation payment. As the invoice was generated over 30 days ago, we
                        would appreciate arranging payment today if possible to avoid escalation. Would you be in a
                        position to make this payment now?"
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="payment-not-received">
                <AccordionTrigger>Payment Not Received</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">If customer indicates they have NOT received payment:</p>
                    <div className="rounded-md bg-muted p-3 text-sm">
                      <p>
                        "I understand you haven't received your compensation payment yet. Thank you for letting me know.
                        I'll make a note of this and have our credit control team check the status of your compensation
                        payment with [Lender Name]. Is this the best number for the team to reach you on?"
                      </p>
                      <p className="mt-2">
                        [After confirmation]: "Thank you. Is there a particular time of day that would be best for them
                        to call you back?"
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="payment-agreement">
                <AccordionTrigger>Payment Agreement</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">If customer agrees to pay:</p>
                    <div className="rounded-md bg-muted p-3 text-sm">
                      <p>
                        "That's great. I can help you with that. We accept all major credit and debit cards. Would you
                        prefer to:
                      </p>
                      <ul className="list-disc pl-6 mt-1">
                        <li>Be transferred to a member of our team to process your payment right now, or</li>
                        <li>
                          Receive a secure payment link via SMS that will allow you to pay with your credit or debit
                          card by clicking on the link?"
                        </li>
                      </ul>
                    </div>

                    <p className="text-sm font-medium mt-3">If transfer requested:</p>
                    <div className="rounded-md bg-muted p-3 text-sm">
                      "I'll transfer you to our payments team right away. Please hold while I connect you." [Trigger
                      warm transfer protocol]
                    </div>

                    <p className="text-sm font-medium mt-3">If SMS requested:</p>
                    <div className="rounded-md bg-muted p-3 text-sm">
                      "I'll send a secure payment link to this number right away. You'll be able to pay using any credit
                      or debit card. You'll receive the SMS shortly."
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="payment-declined">
                <AccordionTrigger>Payment Declined</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">If customer declines to pay:</p>
                      <div className="rounded-md bg-muted p-3 text-sm">
                        "I understand. May I ask why you're unable to make this payment today, or when we may expect
                        payment?" [Listen for response and route accordingly]
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">If financial difficulty mentioned:</p>
                      <div className="rounded-md bg-muted p-3 text-sm">
                        <p>
                          "I understand financial situations can be challenging, and I appreciate you sharing this with
                          me. Allegiant takes a fair and flexible approach in these circumstances. May I ask how much
                          you would be able to afford to pay each month toward this invoice?"
                        </p>
                        <p className="mt-2">[Capture proposed amount]</p>
                        <p className="mt-2">
                          "Thank you for sharing that information. I want to make sure you're aware that there are free
                          and independent debt advice services available that can provide support with managing your
                          finances. Would you like me to share information about these services with you?"
                        </p>
                        <p className="mt-2">[If yes, provide debt advice information]</p>
                        <p className="mt-2">
                          "I'll now transfer you to our customer service team who can discuss your circumstances in more
                          detail and finalize an instalment arrangement that works for you. They may ask some additional
                          questions to ensure the plan is affordable and sustainable for your situation. Please hold
                          while I connect you."
                        </p>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="debt-advice">
                <AccordionTrigger>Debt Advice Information</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">If yes to debt advice:</p>
                    <div className="rounded-md bg-muted p-3 text-sm">
                      "There are several independent organizations that provide free debt advice. MoneyHelper offers
                      free, impartial guidance on managing finances - you can reach them at 0800 138 7777 or visit
                      moneyhelper.org.uk. StepChange Debt Charity provides free expert debt advice and debt management
                      plans - they're available at 0800 138 1111 or stepchange.org. Citizens Advice can also help with
                      debt and consumer issues at citizensadvice.org.uk or by calling their adviceline. These services
                      are confidential and can help you understand all your options."
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="objections">
                <AccordionTrigger>Handling Objections</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">If customer says they didn't agree to the fee:</p>
                      <div className="rounded-md bg-muted p-3 text-sm">
                        "Our records show that you signed our terms of business on [Date] which outlined our fee
                        structure. The fee of [Amount] represents [Percentage]% of the compensation amount recovered,
                        which is in line with our agreement. Would you like me to arrange for a copy of this agreement
                        to be sent to you?" (Action to be requested in call summation)
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">If customer says the fee is too high:</p>
                      <div className="rounded-md bg-muted p-3 text-sm">
                        "I understand your concern about the fee. The amount charged is [Percentage]% of the
                        compensation we recovered for you, which is in line with the agreement you signed and the FCA
                        fee cap for claims management services. This fee covers all the work our team did to
                        successfully secure your compensation. Would you like to discuss a payment plan to help manage
                        this amount, or do you wish to speak with a human colleague"
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">If customer says they've already paid:</p>
                      <div className="rounded-md bg-muted p-3 text-sm">
                        <p>
                          "Thank you for letting me know. I am calling you based on information in our system up to date
                          at 9:00 am this morning. Please can I check how and when you paid".
                        </p>
                        <p className="mt-2">
                          If bank transfer "It can take 48 hours for our accounts team to reconcile payments. Thank you
                          for paying, I will note the file for a colleague to check this".
                        </p>
                        <p className="mt-2">
                          If debit card / credit card (post 9 am today) "Thank you. I will note your file and ask our
                          credit control team to check this has been safely received".
                        </p>
                        <p className="mt-2">
                          If debit card / credit card before 9 am today "I would expect the payment to have been showing
                          on our system. I will pass you to a colleague in our credit control team to investigate this
                          further".
                        </p>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="conclusion">
                <AccordionTrigger>Call Conclusion Options</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">For successful payment arrangements:</p>
                      <div className="rounded-md bg-muted p-3 text-sm">
                        "Thank you for arranging payment [via our team/through the SMS link]. Your invoice [Number] for
                        [Amount] will be marked as paid once the transaction is complete. Thank you for using
                        Allegiant".
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">For installment plan transfers:</p>
                      <div className="rounded-md bg-muted p-3 text-sm">
                        "I'll transfer you to our customer service team now who will help set up an installment plan
                        that works for you. The line will go silent, this may take a few moments. Thank you for your
                        time."
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">For payment follow-up:</p>
                      <div className="rounded-md bg-muted p-3 text-sm">
                        "As agreed, we'll [send an SMS link/have a team member call you on (agreed date/time)]. Thank
                        you for your time today."
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">For non-payment cases:</p>
                      <div className="rounded-md bg-muted p-3 text-sm">
                        "I understand you're not able to make payment today. I've noted the reason as [reason given].
                        Our credit control team will review this and may contact you within the next few business days.
                        Thank you for your time today."
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="tone" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tone and Communication Style</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
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
                      className="h-5 w-5 text-primary flex-shrink-0 mt-0.5"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>
                      Maintain a professional, respectful, friendly and courteous tone throughout all interactions
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
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
                      className="h-5 w-5 text-primary flex-shrink-0 mt-0.5"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Speak clearly and at a measured pace to ensure customer understanding</span>
                  </li>
                  <li className="flex items-start gap-2">
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
                      className="h-5 w-5 text-primary flex-shrink-0 mt-0.5"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>
                      Use natural language with minor variations in wording while preserving all regulatory elements
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
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
                      className="h-5 w-5 text-primary flex-shrink-0 mt-0.5"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Avoid technical jargon, complex financial terminology, or pressuring language</span>
                  </li>
                  <li className="flex items-start gap-2">
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
                      className="h-5 w-5 text-primary flex-shrink-0 mt-0.5"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Be patient and allow customers sufficient time to respond</span>
                  </li>
                  <li className="flex items-start gap-2">
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
                      className="h-5 w-5 text-primary flex-shrink-0 mt-0.5"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Demonstrate active listening through appropriate acknowledgments</span>
                  </li>
                  <li className="flex items-start gap-2">
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
                      className="h-5 w-5 text-primary flex-shrink-0 mt-0.5"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Remain calm and professional even when faced with challenging responses</span>
                  </li>
                  <li className="flex items-start gap-2">
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
                      className="h-5 w-5 text-primary flex-shrink-0 mt-0.5"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Balance formality with conversational warmth to build rapport</span>
                  </li>
                  <li className="flex items-start gap-2">
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
                      className="h-5 w-5 text-primary flex-shrink-0 mt-0.5"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Use a supportive, non-judgmental tone when discussing financial difficulties</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Important Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
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
                      className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>Never mislead customers about the consequences of non-payment</span>
                  </li>
                  <li className="flex items-start gap-2">
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
                      className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>Treat customers fairly and with forbearance if experiencing payment difficulties</span>
                  </li>
                  <li className="flex items-start gap-2">
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
                      className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>
                      Explain that our credit control team can offer flexible repayment options for those in financial
                      difficulty, subject to certain regulatory requirements
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
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
                      className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>Provide information about third party debt counseling when appropriate</span>
                  </li>
                  <li className="flex items-start gap-2">
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
                      className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>Never apply excessive pressure or employ aggressive collection tactics</span>
                  </li>
                  <li className="flex items-start gap-2">
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
                      className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>Respect customer privacy and comply with all data protection requirements</span>
                  </li>
                  <li className="flex items-start gap-2">
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
                      className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>Do not contact customers at unreasonable times (system to schedule appropriate hours)</span>
                  </li>
                  <li className="flex items-start gap-2">
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
                      className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>Allow customers to exit the conversation politely if they wish</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vulnerability" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vulnerability Identification</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">Listen for indicators of potential vulnerability:</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
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
                      className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>Mention of serious illness or hospitalisation</span>
                  </li>
                  <li className="flex items-start gap-2">
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
                      className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>Recent bereavement or family crisis</span>
                  </li>
                  <li className="flex items-start gap-2">
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
                      className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>Mental health challenges</span>
                  </li>
                  <li className="flex items-start gap-2">
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
                      className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>Language or comprehension difficulties</span>
                  </li>
                  <li className="flex items-start gap-2">
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
                      className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>Age-related factors affecting understanding</span>
                  </li>
                  <li className="flex items-start gap-2">
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
                      className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>Financial hardship signifiers</span>
                  </li>
                  <li className="flex items-start gap-2">
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
                      className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>Addiction issues</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vulnerability Response</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">If vulnerability indicators are detected:</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
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
                      className="h-5 w-5 text-primary flex-shrink-0 mt-0.5"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Adjust your pace and complexity of language accordingly</span>
                  </li>
                  <li className="flex items-start gap-2">
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
                      className="h-5 w-5 text-primary flex-shrink-0 mt-0.5"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Exercise additional patience and empathy</span>
                  </li>
                  <li className="flex items-start gap-2">
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
                      className="h-5 w-5 text-primary flex-shrink-0 mt-0.5"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Prioritise immediate warm transfer to specialist human team</span>
                  </li>
                  <li className="flex items-start gap-2">
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
                      className="h-5 w-5 text-primary flex-shrink-0 mt-0.5"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Note the nature of vulnerability for the specialist team (with appropriate sensitivity)</span>
                  </li>
                  <li className="flex items-start gap-2">
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
                      className="h-5 w-5 text-primary flex-shrink-0 mt-0.5"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Never pressure vulnerable customers for immediate payment</span>
                  </li>
                  <li className="flex items-start gap-2">
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
                      className="h-5 w-5 text-primary flex-shrink-0 mt-0.5"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Offer to reschedule the conversation if needed</span>
                  </li>
                  <li className="flex items-start gap-2">
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
                      className="h-5 w-5 text-primary flex-shrink-0 mt-0.5"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Provide clear, simple explanations of next steps</span>
                  </li>
                  <li className="flex items-start gap-2">
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
                      className="h-5 w-5 text-primary flex-shrink-0 mt-0.5"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Reassure that support is available</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vulnerability Handling Examples</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      If customer mentions serious vulnerability (bereavement, critical illness, etc.):
                    </p>
                    <div className="rounded-md bg-muted p-3 text-sm">
                      <p>
                        "I'm very sorry to hear about your situation. Thank you for sharing that with me. Allegiant has
                        a dedicated team who are specially trained to provide support in these circumstances. I'd like
                        to connect you with them now, if that's okay with you? They'll be able to discuss your options
                        and find an appropriate arrangement."
                      </p>
                      <p className="mt-2">
                        [After confirmation]: "Thank you. I'll transfer you now. Please hold while I connect you to our
                        specialist support team."
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      If customer exhibits signs of vulnerability but doesn't explicitly mention it:
                    </p>
                    <div className="rounded-md bg-muted p-3 text-sm">
                      "I understand this might be a difficult time for you. Allegiant has a specialist team who may be
                      better able to assist with your specific circumstances. Would you prefer to speak with them
                      instead?"
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">If customer mentions mental health challenges:</p>
                    <div className="rounded-md bg-muted p-3 text-sm">
                      "Thank you for sharing that information with me. I want to ensure you receive the most appropriate
                      support. We have team members who are specially trained to help in these situations. Would you
                      like me to transfer you to them now?"
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">If customer indicates financial vulnerability:</p>
                    <div className="rounded-md bg-muted p-3 text-sm">
                      "I understand that managing finances can be challenging. Before I transfer you to our specialist
                      team, are you currently receiving assistance from any debt advice services? This information will
                      help our team provide you with the most appropriate support."
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Download Full Script</Button>
        <Button>Save Changes</Button>
      </CardFooter>
    </Card>
  )
}

