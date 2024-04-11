
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const { spawn } = require('child_process');

app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

const outputsDir = path.join(__dirname, 'outputs', 'final');
if (!fs.existsSync(outputsDir)) {
    fs.mkdirSync(outputsDir, { recursive: true });
}

let imageIdCounter = 0;

// POST /create/
app.post('/create/', (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }
    // Simulate API request to /v1/generation/text-to-image and fetching the image
    // Assuming Python script handles this because of complexity in actual request and image generation
    const pythonProcess = spawn('python', ['generate_image.py', prompt, imageIdCounter.toString()]);

    pythonProcess.stdout.on('data', (data) => {
        console.log(`Image generated with ID: ${imageIdCounter}`);
        imageIdCounter += 1; // Increment counter after image is saved successfully
        res.json({ id: imageIdCounter - 1 });
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Error: ${data.toString()}`);
        res.status(500).json({ error: 'Error generating image' });
    });
});

// POST /img/
app.post('/img/', (req, res) => {
    const { influencerId, prompt } = req.body;
    if (!influencerId || !prompt) {
        return res.status(400).json({ error: 'Influencer ID and prompt are required' });
    }
    // Similar handling as /create/ but image manipulation based on influencer
    const pythonProcess = spawn('python', ['generate_influencer_image.py', influencerId, prompt]);

    pythonProcess.stdout.on('data', (data) => {
        console.log('Image generated for influencer');
        res.sendStatus(200);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Error: ${data.toString()}`);
        res.status(500).json({ error: 'Error generating influencer image' });
    });
});

// GET /img/:id
app.get('/img/:id', (req, res) => {
    const { id } = req.params;
    const imagePath = path.join(outputsDir, `${id}.png`);
    if (fs.existsSync(imagePath)) {
        res.sendFile(imagePath);
    } else {
        res.status(404).json({ error: 'Image not found' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
