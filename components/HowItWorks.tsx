"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Upload, Brain, Edit3, Share2, BarChart } from "lucide-react"

const steps = [
  { icon: Upload, title: "Upload Video", description: "Upload your video to our secure platform" },
  { icon: Brain, title: "AI Analysis", description: "Our AI analyzes the content and generates intelligent chapters" },
  { icon: Edit3, title: "Review & Fine-tune", description: "Review and fine-tune the generated chapters if needed" },
  { icon: Share2, title: "Embed & Share", description: "Embed the enhanced video player on your website or share directly" },
  { icon: BarChart, title: "Boost Engagement", description: "Enjoy increased viewer engagement and improved content navigation" },
]

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0)

  const handleNext = () => setActiveStep((prev) => Math.min(steps.length - 1, prev + 1))
  const handlePrevious = () => setActiveStep((prev) => Math.max(0, prev - 1))

  return (
    <section className="py-16 px-4 bg-background">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <Card>
          <CardHeader>
            <CardTitle>Follow these simple steps</CardTitle>
            <CardDescription>Learn how our platform enhances your video content</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeStep.toString()} onValueChange={(value) => setActiveStep(parseInt(value))} className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-8">
                {steps.map((step, index) => (
                  <TabsTrigger
                    key={index}
                    value={index.toString()}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    disabled={index > activeStep}
                  >
                    <step.icon className="w-5 h-5" />
                    <span className="sr-only">{step.title}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              <Progress value={(activeStep / (steps.length - 1)) * 100} className="mb-8" />
              {steps.map((step, index) => (
                <TabsContent key={index} value={index.toString()}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-2xl">
                        <step.icon className="w-8 h-8 mr-3 text-primary" />
                        {step.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg text-muted-foreground">{step.description}</p>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={activeStep === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        onClick={handleNext}
                        disabled={activeStep === steps.length - 1}
                      >
                        {activeStep === steps.length - 1 ? "Finish" : "Next"}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}