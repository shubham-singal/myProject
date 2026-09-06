import 'dotenv/config'

const express = require('express');
const db = require('./db');
const OpenAI = require("openai");
const app = express()
const port = 3000

const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'chat.log');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
app.use(express.json()); 

app.get('/api/products', async (req, res) => {
	try {
    const [rows] = await db.query('SELECT * FROM products');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})


// Get product By ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;

    const [rows] = await db.query(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(rows[0]);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Save chat message
app.post('/api/sendMsg', async (req, res) => {
  try {
    const { message } = req.body;

    console.log(message);
    const timestamp = new Date().toISOString();
    const ip = req.ip;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: message }],
    });
    const reply = completion.choices[0].message.content;
	  console.log(reply);

	  const logEntry = `
========================================
Timestamp: ${timestamp}
IP: ${ip}
User: $:{message}
LLM: ${reply}
========================================

`;
	   console.log('__dirname:', __dirname);
    console.log('logFile:', logFile);

    fs.appendFileSync(logFile, logEntry);

    console.log('Log written successfully');

    res.json({ reply });

  } catch (err) {
    console.error('Error in /api/sendMsg:', err);

    res.status(500).json({
      error: err.message
    });
  }
});




app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
