const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());  // for parsing application/json

app.post('/api/fetch-data', async (req, res) => {
    const { url } = req.body;
    const username = 'nasaspacehackathon_stella_william';
    const password = '8fWk82EJEv';

    if (!url) {
        return res.status(400).send('URL is required');
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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
