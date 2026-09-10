require('dotenv').config();

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
    const timestamp = new Date().toISOString();
    const ip = req.ip;
    const { message } = req.body;

    const [rows] = await db.query(
      `SELECT role, message FROM chat_messages
      WHERE user_id = ? ORDER BY id ASC`, [1]
    );

    const chatHistory = rows.map(row =>({
      role : row.role,
      content: row.message
    }));

    chatHistory.push({
      role : 'user',
      content: message
    });

    await db.query(`INSERT INTO chat_messages (user_id, role, message) VALUES (?, ?, ?)`,[1, 'user', message]);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: chatHistory,
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });
   
    await db.query(`INSERT INTO chat_messages (user_id, role, message) VALUES (?, ?, ?)`,[1, 'assistant', reply]);	  
	  
    
    saveLogToFile(timestamp, ip, message, reply);

  } catch (err) {
    console.error('Error in /api/sendMsg:', err);
    res.status(500).json({
      error: err.message
    });
  }
});


function saveLogToFile(timestamp, ip, message, reply) {
  	  const logEntry = 
`========================================
    Timestamp: ${timestamp}
    IP: ${ip}
    User: ${message}
    LLM: ${reply}
========================================`;

    fs.appendFileSync(logFile, logEntry);
}



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
