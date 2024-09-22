import type { NextApiRequest, NextApiResponse } from 'next'
import AWS from 'aws-sdk'

// Wrap AWS configuration in a try-catch block
try {
  AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  })
} catch (error) {
  console.error('Error configuring AWS:', error)
}

const lambda = new AWS.Lambda()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { videoUrl } = req.body

      console.log('Received request to process video:', videoUrl)

      // Check if all required environment variables are set
      if (!process.env.AWS_LAMBDA_FUNCTION) {
        throw new Error('AWS_LAMBDA_FUNCTION is not set')
      }

      const params = {
        FunctionName: process.env.AWS_LAMBDA_FUNCTION,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({ videoUrl }),
      }

      console.log('Invoking Lambda function with params:', JSON.stringify(params, null, 2))

      const response = await lambda.invoke(params).promise()
      
      console.log('Received response from Lambda:', JSON.stringify(response, null, 2))

      if (response.FunctionError) {
        throw new Error(`Lambda function error: ${response.FunctionError}`)
      }

      if (!response.Payload) {
        throw new Error('No payload received from Lambda function')
      }

      const result = JSON.parse(response.Payload as string)

      console.log('Parsed result:', JSON.stringify(result, null, 2))

      if (result.statusCode !== 200) {
        throw new Error(result.error || 'Unknown error occurred in Lambda function')
      }

      if (!result.chapters || !Array.isArray(result.chapters)) {
        throw new Error('Invalid or missing chapters data from Lambda function')
      }

      res.status(200).json({ chapters: result.chapters })
    } catch (error) {
      console.error('Error processing video:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
      const errorStack = error instanceof Error ? error.stack : ''
      res.status(500).json({ 
        error: 'Error processing video', 
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
        awsRegion: process.env.AWS_REGION,
        lambdaFunctionName: process.env.AWS_LAMBDA_FUNCTION,
      })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}