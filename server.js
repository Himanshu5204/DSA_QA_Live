import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_DSA_API_KEY);

let History = [];

app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));

// API route
app.post('/api/answer', async (req, res) => {
  try {
    const { question } = req.body;

    console.log("API Key Loaded:", process.env.GEMINI_DSA_API_KEY); // Test
    console.log("Incoming request body:", req.body);

    // Add user question to history
    History.push({ role: 'user', parts: [{ text: question }] });

    // Get model
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `You are a data structure and algorithm expert and instructor.
        You will help the user understand and implement various DSA concepts with simple explanations and code snippets.
        Use Java by default unless user specifies another language.
        Ignore non-DSA questions and respond: "I'm sorry, I can only help with data structures and algorithms."`
    });

    // Create chat instance
    const chat = model.startChat({
      history: History
    });

    // Send question
    console.log("Before Gemini API call");
    const response = await chat.sendMessage(question);
    console.log("After Gemini API call");
    console.log("Full Gemini response:", JSON.stringify(response, null, 2));

    // Try to extract answer robustly
    let answer = "No answer available.";
    if (response && response.response) {
      if (typeof response.response.text === 'function') {
        answer = await response.response.text();
      } else if (typeof response.response.text === 'string') {
        answer = response.response.text;
      } else if (response.response.candidates?.[0]?.content?.parts?.[0]?.text) {
        answer = response.response.candidates[0].content.parts[0].text;
      }
    }

    // Add AI reply to history
    History.push({ role: 'model', parts: [{ text: answer }] });

    res.json({ answer });

  } catch (err) {
    console.error(err);
    res.status(500).json({ answer: 'Error generating answer.' });
  }
});

app.listen(3000, () =>
  console.log("🚀 Server running at http://localhost:3000")
);