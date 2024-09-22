import type { NextApiRequest, NextApiResponse } from 'next'
import { IncomingForm } from 'formidable'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { exec } from 'child_process'
import util from 'util'

const execPromise = util.promisify(exec)
const writeFilePromise = util.promisify(fs.writeFile)

// Assume the template.yml is in the root of your project
const TEMPLATE_PATH = path.join(process.cwd(), 'template.yml')

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const form = new IncomingForm()

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ error: 'Error parsing form data' })
      }

      try {
        // Save the uploaded file to a temporary directory
        const fileArray = files.video as unknown as { filepath: string; originalFilename: string }[]
        const file = fileArray[0]
        const tempDir = path.join(os.tmpdir(), 'video-uploads')
        
        // Create the temporary directory if it doesn't exist
        await fs.promises.mkdir(tempDir, { recursive: true })
        
        const localFilePath = path.join(tempDir, file.originalFilename)
        await fs.promises.copyFile(file.filepath, localFilePath)

        // For local testing, we'll use a placeholder S3 bucket name and key
        const s3Bucket = 'local-test-bucket'
        const s3Key = `uploads/${file.originalFilename}`

        // Create a temporary file for the event data
        const eventData = JSON.stringify({
          s3_bucket: s3Bucket,
          s3_key: s3Key
        })
        const eventFilePath = path.join(os.tmpdir(), `event-${Date.now()}.json`)
        await writeFilePromise(eventFilePath, eventData)

        // Properly format the parameter overrides
        const parameterOverrides = [
          `OPENAI_API_KEY=${process.env.OPENAI_API_KEY}`,
          `S3_BUCKET_NAME=${s3Bucket}`
        ].join(' ')

        // Construct the SAM CLI command
        const command = `sam local invoke AutoCropperFunction -t "${TEMPLATE_PATH}" --event "${eventFilePath}" --parameter-overrides "${parameterOverrides}" --docker-network host`

        console.log('Executing command:', command)  // Log the command for debugging

        // Invoke SAM local Lambda
        const { stdout, stderr } = await execPromise(command)

        // Clean up the temporary file
        await fs.promises.unlink(eventFilePath)

        if (stderr) {
          console.error('SAM local stderr:', stderr)
        }

        console.log('SAM local stdout:', stdout)  // Log the stdout for debugging

        const result = JSON.parse(stdout)

        if (result.statusCode !== 200) {
          throw new Error(result.body?.error || 'Unknown error occurred in Lambda function')
        }

        const body = JSON.parse(result.body)

        if (!body.cropped_videos || !Array.isArray(body.cropped_videos)) {
          throw new Error('Invalid or missing cropped videos data from Lambda function')
        }

        res.status(200).json({ 
          originalVideoUrl: `s3://${s3Bucket}/${s3Key}`,
          croppedVideos: body.cropped_videos 
        })
      } catch (error) {
        console.error('Error processing video:', error)
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
        res.status(500).json({ 
          error: 'Error processing video', 
          details: errorMessage,
        })
      }
    })
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}