"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Upload, Brain, List, Share2, BarChart } from "lucide-react"

const steps = [
  { icon: Upload, title: "Upload Video", description: "Upload your video to our platform" },
  { icon: List, title: "Content Inspiration", description: "Select up to 3 videos as inspiration" },
  { icon: Brain, title: "AI Editing", description: "Our AI fuses your video with other video formats" },
  { icon: BarChart, title: "Boost Engagement", description: "Enjoy your transformative brand and increased viewer engagement!" },
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
          <CardContent>
            <Tabs value={activeStep.toString()} onValueChange={(value) => setActiveStep(parseInt(value))} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8 mt-8">
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