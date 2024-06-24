const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

const clientId = '5f94b7d8-eb24-414a-b25b-249f11ca27f9';
const clientSecret = '2e6738d4-e428-4265-8d1f-db4f9c2a5423';
const redirectUri = 'https://card-d7avfe8bw-israel-adonis-urbina-vargas-projects.vercel.app//oauth-callback'; // Cambia esto a tu URI de redirección

let accessToken = '';

// Middleware para parsear JSON
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Paso 1: Iniciar el proceso OAuth
app.get('/auth', (req, res) => {
  const authUrl = `https://app.hubspot.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=contacts`;
  res.redirect(authUrl);
});

// Paso 2: Manejar la redirección de OAuth
app.get('/oauth-callback', async (req, res) => {
  const authorizationCode = req.query.code;

  try {
    const response = await axios.post('https://api.hubapi.com/oauth/v1/token', null, {
      params: {
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: authorizationCode
      }
    });

    accessToken = response.data.access_token;
    res.send('Access Token obtenido. Ahora puedes hacer solicitudes a la API de HubSpot.');
  } catch (error) {
    console.error('Error obteniendo el Access Token:', error);
    res.status(500).send('Error obteniendo el Access Token');
  }
});

// Paso 3: Hacer solicitudes a la API de HubSpot utilizando el Access Token
app.get('/api/hubspot-data', async (req, res) => {
  if (!accessToken) {
    return res.status(400).send('Access Token no disponible. Por favor, autentícate primero.');
  }

  const hubspotApiUrl = 'https://api.hubapi.com/crm/v3/objects/contacts';

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

    res.json({
      results: contacts.map(contact => ({
        objectId: contact.id,
        title: `${contact.time} - ${contact.name}`,
        link: {
          href: `https://app.hubspot.com/contacts/${contact.id}`,
          label: "Ver en HubSpot"
        }
      }))
    });
  } catch (error) {
    console.error('Error fetching data from HubSpot:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Servir el archivo HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`App running on http://localhost:${port}`);
});
