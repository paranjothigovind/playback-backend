const express = require('express');
const AWS = require('aws-sdk');
const serverless = require('aws-serverless-express');

const app = express();
const s3 = new AWS.S3();

app.get('/presigned-url', (req, res) => {
  const params = {
    Bucket: req.query.bucket_name,
    Key: req.query.object_key,
    Expires: 60,
    ContentType: 'audio/mpeg',
  };

  s3.getSignedUrl('putObject', params, (err, url) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error generating pre-signed URL');
    }
    res.json({ uploadUrl: url });
  });
});

const server = serverless.createServer(app);

exports.handler = (event, context) => {
  serverless.proxy(server, event, context);
};
