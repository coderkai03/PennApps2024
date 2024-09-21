import type { NextApiRequest, NextApiResponse } from 'next'
import AWS from 'aws-sdk'

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
})

const lambda = new AWS.Lambda()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { videoUrl } = req.body

      console.log('Received request to process video:', videoUrl)

      const params = {
        FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME!,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({ videoUrl }),
      }

      console.log('Invoking Lambda function with params:', params)

      const response = await lambda.invoke(params).promise()
      
      console.log('Received response from Lambda:', response)

      if (response.FunctionError) {
        throw new Error(`Lambda function error: ${response.FunctionError}`)
      }

      const result = JSON.parse(response.Payload as string)

      console.log('Parsed result:', result)

      if (result.statusCode !== 200) {
        throw new Error(result.error || 'Unknown error occurred in Lambda function')
      }

      if (!result.chapters || !Array.isArray(result.chapters)) {
        throw new Error('Invalid or missing chapters data from Lambda function')
      }

      res.status(200).json({ chapters: result.chapters })
    } catch (error) {
      console.error('Error processing video:', error)
      const errorMessage = (error as Error).message;
      res.status(500).json({ error: 'Error processing video', details: errorMessage })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}