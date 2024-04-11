const express = require('express');
const fs = require('fs');
const { request } = require('http');
const app = express();
const PORT = 3000; // Port where your Express server will listen

app.use(express.json());

let imageCounter = 0; // This will help track the ID for images

// POST /create/: to generate an image from text
app.post('/create/', (req, res) => {
    const postData = JSON.stringify({
        prompt: req.body.prompt, async_process: true
    });

    const options = {
        hostname: 'localhost',
        port: 8888,
        path: '/v1/generation/text-to-image',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const reqInternal = request(options, (resInternal) => {
        let data = '';

        resInternal.on('data', (chunk) => {
            data += chunk;
        });

        resInternal.on('end', () => {
            const parsedData = JSON.parse(data);
            const imgBuffer = Buffer.from(parsedData.image, 'base64'); // Assuming API responds with base64-encoded image

            const imgPath = `./final/${imageCounter}.png`;
            fs.writeFile(imgPath, imgBuffer, (err) => {
                if (err) {
                    return res.status(500).json({ error: "Failed to save the image" });
                }
                imageCounter++;
                res.json({ id: imageCounter - 1 });
            });
        });
    });

    reqInternal.on('error', (e) => {
        res.status(500).json({ error: e.message });
    });

    reqInternal.write(postData);
    reqInternal.end();
});

// POST /img/: to generate an image for a specific influencer
app.post('/img/', (req, res) => {
    const { prompt } = req.body; // Extracting prompt from the request body
    const influencerId = req.body.id; // Extracting influencer id from the URL
    const influencerImage = fs.readFileSync(`path_to_influencer_images/${influencerId}.png`);

    const postData = JSON.stringify({
        prompt: prompt,
        input_image: influencerImage.toString('base64'), // Convert binary image to a base64 string
        cn_type1: 'FaceSwap', async_process: true
    });

    const options = {
        hostname: 'localhost',
        port: 8888,
        path: '/v1/generation/image-prompt',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const reqInternal = request(options, (resInternal) => {
        let data = '';

        resInternal.on('data', (chunk) => {
            data += chunk;
        });

        resInternal.on('end', () => {
            // Processing the response
            // Save or handle the image as necessary
            res.json({ message: "Image generated for influencer" });
        });
    });

    reqInternal.on('error', (e) => {
        res.status(500).json({ error: e.message });
    });

    reqInternal.write(postData);
    reqInternal.end();
});

// GET /img/:id: Return the image of the influencer with the given ID
app.get('/img/:id', (req, res) => {
    const imgId = req.params.id;
    const filePath = `./final/${imgId}.png`;

    res.sendFile(filePath, { root: __dirname });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
