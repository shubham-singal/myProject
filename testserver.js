require('dotenv').config();

const db = require('./db');

const express = require('express');
const app = express();
const port = 3000;

const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'chat.log');

const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


app.use(express.json());

app.get('/', async (req, res) => {
  try {
    const[rows] = await db.query('SELECT * FROM chat_messages');
    res.status(200).json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      error: err.message
    })
  }

});


app.get('/api/products', async (req, res) => {
	try {
    const [rows] = await db.query('SELECT * FROM products');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


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

    // 1. Get user's previous chat history
    const [rows] = await db.query(
      `SELECT role, message
       FROM chat_messages
       WHERE user_id = ?
       ORDER BY id ASC`,
      [1]
    );

    const chatHistory = getChatHistory(rows);

    // 2. Get available products
    const [products] = await db.query(
      `SELECT * FROM products`
    );

    // 3. Build prompt
    const systemPrompt = buildSystemPrompt(products);

    const prompt = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...chatHistory,
      {
        role: 'user',
        content: message
      }
    ];

    console.log('Prompt:', prompt);

    // 4. Save user's message
    await db.query(
      `INSERT INTO chat_messages (user_id, role, message)
       VALUES (?, ?, ?)`,
      [1, 'user', message]
    );

    // 5. Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: prompt
    });

    const reply = completion.choices[0].message.content;

    console.log('Response from LLM:', reply);

    // 6. Save assistant's response
    await db.query(
      `INSERT INTO chat_messages (user_id, role, message)
       VALUES (?, ?, ?)`,
      [1, 'assistant', reply]
    );

    // 7. Log request/response
    saveLogToFile(timestamp, ip, message, reply);

    // 8. Send response to client
    res.json({ reply });

  } catch (err) {
    console.error('Error in /api/sendMsg:', err);

    res.status(500).json({
      error: err.message
    });
  }
});

const buildSystemPrompt = (products) => {
  const systemInstructions = `
Your task is to recommend a product to buy for the user based on:
1. The user's current question
2. The user's previous chat history
3. The available product selection pool
`;

  const constraints = `
Rules:
1. Only recommend products that exist in the product selection pool.
2. Use the user's stated preferences, requirements, and budget when making recommendations.
3. If the user has not provided enough information, ask a clarifying question.
4. Do not invent product names, prices, specifications, or features.
5. If the user asks for a product that is not in the selection pool, politely inform them that it is unavailable and suggest alternatives from the pool.
6. Do not answer questions unrelated to product recommendations.
7. If the user asks an unrelated question, politely explain that you can only provide product recommendations based on the available selection pool.
`;

  const example = `
Example:
User: "I'm a beginner tennis player and want something inexpensive."

Assistant: "I'd recommend the Wilson RF 01 Feel. It's a beginner-friendly option at a lower price point. If you'd like, I can also compare it with the other tennis racquets in our selection."
`;

  return `${systemInstructions}
${constraints}
${example}
Product selection pool:
${JSON.stringify(products)}
`;
};

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

function getChatHistory(chatRecords) {
  return chatRecords.map(row => ({
    role : row.role,
    content: row.message
  }));

}


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
