import type { NextApiRequest, NextApiResponse } from 'next'
import AWS from 'aws-sdk'

// Configure AWS SDK
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

      const params = {
        FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME!,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({ videoUrl }),
      }

      const response = await lambda.invoke(params).promise()
      const result = JSON.parse(response.Payload as string)

      res.status(200).json(result)
    } catch (error) {
      console.error('Error invoking Lambda function:', error)
      res.status(500).json({ error: 'Error processing video' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}