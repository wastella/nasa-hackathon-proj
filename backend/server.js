const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());  // for parsing application/json

app.post('/api/fetch-data', async (req, res) => {
    const { url } = req.body;
    const username = process.env.NASAUSER;
    const password = process.env.NASAPASS;

    if (!url) {
        return res.status(400).send('URL is required');
    }

    if (!username || !password) {
        return res.status(500).send('API credentials are not configured');
    }

    try {
        const response = await axios.get(url, {
            auth: {
                username: username,
                password: password
            }
        });
        
        res.send(response.data);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Error fetching data');
    }
});

app.get('/api/config', (req, res) => {
    res.json({
        API_KEY: process.env.API_KEY
    });
});

// Remove the app.listen() call for Vercel deployment
// app.listen(port, () => console.log(`Server running on http://localhost:${port}`));

// Export the Express app
module.exports = app;



