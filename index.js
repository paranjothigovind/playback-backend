const express = require('express');
const serverless = require('aws-serverless-express');
const cors = require('cors');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const s3 = new S3Client({
  credentials: {
    accessKeyId: "",
    secretAccessKey: "",
  },
  region: 'us-east-1',
});

// const _s3 = new AWS.S3();


app.get('/', (req, res) => {
  res.send('Hello World');
});

const server = serverless.createServer(app);

app.listen(8000, () => {
  console.log('Server is running on http://localhost:3000');
});

app.get('/presigned-url', async (req, res) => {
  const {
    file_name,
    bucket_name,
    content_type,
    expires 
  } = req.query || {};
  const params = {
    Bucket: bucket_name || 'awsbackendstack-audiobucket96beecba-mism2ey05iin',
    Key: file_name || 'sample.jpg',
    ContentType: content_type || "multipart/form-data",
    Expires: Number(expires) || 60, // URL validity in seconds
  };

  try {
    const command = new PutObjectCommand({Bucket: bucket_name || 'awsbackendstack-audiobucket96beecba-mism2ey05iin', Key: file_name || 'sample.jpg', expiresIn: 15 * 60 });
    const url = await getSignedUrl(s3, command, { expiresIn: 15 * 60 });
    // const url = await _s3.getSignedUrl('putObject', params);
    console.log(url);
    res.status(200).json({ url });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error generating presigned URL');
  }
});

exports.handler = (event, context) => {
  serverless.proxy(server, event, context);
};
