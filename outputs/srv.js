const express = require('express');
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const http = require('http');

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

let imageCounter = 0; // To keep track of image ids

// Setting the extended timeout options for node-fetch
const fetchOptions = {
    timeout: 480000, // Timeout set to 8 minutes
    agent: new http.Agent({
        keepAlive: true,
        timeout: 480000 // Keep the connection alive up to 8 minutes
    })
};

app.post('/create/', async (req, res) => {
    const { prompt } = req.body;
    try {
        const response = await fetch(`${API_BASE_URL}/v1/generation/text-to-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, async_process: true }),
            ...fetchOptions
        });
        if (!response.ok) throw new Error(`HTTP status ${response.status} - ${response.statusText}`);

        const jobData = await response.json();
        const jobId = jobData.id; // Assume job ID is returned here for tracking

        setTimeout(async () => {
            const imgData = await fetch(`${API_BASE_URL}/fetch_image/${jobId}`, fetchOptions);
            const imgBuffer = await imgData.buffer();

            const newImgPath = path.join(IMAGE_FOLDER_PATH, `${imageCounter}.png`);
            fs.writeFileSync(newImgPath, imgBuffer);
            res.json({ id: imageCounter++ });

        }, 240000); // Wait for 4 minutes before trying to fetch the result image

    } catch (error) {
        console.error('Request failed', error);
        res.status(500).json({ error: 'Internal server error during image creation' });
    }
});

app.post('/img/', async (req, res) => {
    const { id, prompt } = req.body;
    const influencerImagePath = path.join(IMAGE_FOLDER_PATH, `${id}.png`);
    const formData = new FormData();
    formData.append('input_image', fs.createReadStream(influencerImagePath));
    formData.append('prompt', prompt);
    formData.append('cn_type1', 'FaceSwap');

    try {
        const response = await fetch(`${API_BASE_URL}/v1/generation/image-prompt`, {
            method: 'POST',
            body: formData,
            ...fetchOptions
        });
        if (!response.ok) throw new Error(`HTTP status ${response.status} - ${response.statusText}`);

        const imgBuffer = await response.buffer();
        const modifiedImagePath = path.join(IMAGE_FOLDER_PATH, `modified_${id}.png`);
        fs.writeFileSync(modifiedImagePath, imgBuffer);
        res.sendFile(modifiedImagePath);

    } catch (error) {
        console.error('Request failed', error);
        res.status(500).json({ error: 'Internal server error during image prompt processing' });
    }
});

app.get('/img/:id', (req, res) => {
    const { id } = req.params;
    const imgPath = path.join(IMAGE_FOLDER_PATH, `${id}.png`);
    if (fs.existsSync(imgPath)) {
        res.sendFile(imgPath);
    } else {
        res.status(404).send('Image not found');
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
