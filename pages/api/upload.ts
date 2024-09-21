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
        const uploadPromise = s3.upload(uploadParams).promise()
        
        // Set up progress tracking
        let progress = 0
        s3.upload(uploadParams).on('httpUploadProgress', (evt) => {
          progress = Math.round((evt.loaded / evt.total) * 100)
          res.write(JSON.stringify({ progress }))
        }).send((err: Error, data: AWS.S3.ManagedUpload.SendData) => {
          if (err) throw err;
          res.write(JSON.stringify({ progress: 100, videoUrl: data.Location }))
          res.end()
        })

        await uploadPromise
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