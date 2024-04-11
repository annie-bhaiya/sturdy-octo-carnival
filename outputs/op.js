const express = require('express');
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const API_BASE_URL = 'http://localhost:8888';
const IMAGE_DIR = './final';
const IMAGE_FOLDER_PATH = path.join(__dirname, IMAGE_DIR);

// Ensure the image directory exists
if (!fs.existsSync(IMAGE_FOLDER_PATH)) {
    fs.mkdirSync(IMAGE_FOLDER_PATH, { recursive: true });
}

let imageCounter = 0;  // To keep track of image ids

app.post('/create/', async (req, res) => {
    const { prompt } = req.body;
    try {
        // Initiate image generation job
        const response = await fetch(`${API_BASE_URL}/v1/generation/text-to-image/init`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });

        if (!response.ok) throw new Error(`HTTP status ${response.status} - ${response.statusText}`);

        const jobData = await response.json();
        res.json({ message: "Job submitted. Please poll job status.", jobId: jobData.jobId });

    } catch (error) {
        console.error('Request failed', error);
        res.status(500).json({ error: 'Failed to initialize image creation job' });
    }
});

app.get('/status/:jobId', async (req, res) => {
    // Poll the API to check the job status
    try {
        const { jobId } = req.params;
        const response = await fetch(`${API_BASE_URL}/v1/generation/status/${jobId}`);
        const jobStatus = await response.json();

        res.json(jobStatus);

    } catch (error) {
        console.error('Status check failed', error);
        res.status(500).json({ error: 'Failed to check job status' });
    }
});

app.get('/result/:jobId', async (req, res) => {
    const { jobId } = req.params;
    try {
        // Fetch the result image from the API
        const imgData = await fetch(`${API_BASE_URL}/v1/generation/get_image/${jobId}`);
        const imgBuffer = await imgData.buffer();

        const imgPath = path.join(IMAGE_FOLDER_PATH, `${imageCounter}.png`);
        fs.writeFileSync(imgPath, imgBuffer);
        res.sendFile(imgPath);

        // Increment image counter for the next image
        imageCounter++;

    } catch (error) {
        console.error('Failed to fetch image', error);
        res.status(500).json({ error: 'Failed to retrieve generated image' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
