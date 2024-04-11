const express = require('express');
const http = require('http');

const app = express();
const PORT = 3000;

app.use(express.json());

app.post('/v1/generation/text-to-image', (req, res) => {
  try {
    const { prompt } = req.body;

    // Data to be sent in the POST request
    const postData = JSON.stringify({
      prompt,
      async_process: true
    });

    // Options for the POST request
    const options = {
      hostname: 'localhost',
      port: 8888,
      path: '/v1/generation/text-to-image',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    // Making the POST request using http module
    const request = http.request(options, (response) => {
      let responseData = '';

      response.on('data', (chunk) => {
        responseData += chunk;
      });

      response.on('end', () => {
        res.json(JSON.parse(responseData));
      });
    });

    request.on('error', (error) => {
      console.error('Error occurred:', error);
      res.status(500).json({ error: 'An error occurred while processing your request.' });
    });

    // Send the data in the POST request body
    request.write(postData);
    request.end();
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



