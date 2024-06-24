const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

const hubspotApiUrl = 'https://api.hubapi.com/crm/v3/objects/contacts';
const accessToken = process.env.pat-na1-f441ed05-56e8-4200-bb2e-30208efaae68;

// Middleware para parsear JSON
app.use(express.json());

app.get('/api/hubspot-data', async (req, res) => {
  try {
    const response = await axios.get(hubspotApiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const contacts = response.data.results.map(contact => {
      return {
        id: contact.id,
        name: `${contact.properties.firstname} ${contact.properties.lastname}`,
        email: contact.properties.email,
        time: new Date().toLocaleTimeString()
      };
    });

    res.json(contacts);
  } catch (error) {
    console.error('Error fetching data from HubSpot:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`App running on http://localhost:${port}`);
});
