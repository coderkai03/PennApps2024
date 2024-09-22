import type { NextApiRequest, NextApiResponse } from 'next'
import AWS from 'aws-sdk'
import { IncomingForm } from 'formidable'
import fs from 'fs'

export const config = {
  api: {
    bodyParser: false,
  },
}

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const form = new IncomingForm()

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ error: 'Error parsing form data' })
      }

      const fileArray = files.video as unknown as { filepath: string; originalFilename: string }[]
      const file = fileArray[0]
      const stream = fs.createReadStream(file.filepath)

      const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: `videos/${Date.now()}_${file.originalFilename}`,
        Body: stream,
      }

      try {
        
        
        const result = await s3.upload(uploadParams).promise()

        const flaskApiResponse = await fetch('http://127.0.0.1:5000/process-video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            videoUrl: result.Location, // Send the S3 URL to Flask
          }),
        })

        const flaskData = await flaskApiResponse.json()

        console.log(flaskData)

        res.status(200).json({ videoUrl: result.Location })
      } catch (error) {
        console.error('Error uploading to S3:', error)
        res.status(500).json({ error: 'Error uploading file' })
      }
    })
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
