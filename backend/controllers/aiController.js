import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateDescription(req, res) {
  try {
    const { description, category, state, city, area } = req.body;

    if (!description || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const locationStr = [area, city, state].filter(Boolean).join(', ') || 'Unknown location';

    const prompt = `You are a civic issue reporter. Given the following details, write a short, clear, and engaging 1-sentence description of the issue.

Category: ${category}
User description: ${description}
Location: ${locationStr}

Rules:
- Keep it to ONE sentence, max 20 words.
- Use a neutral, factual tone.
- Include the location naturally.
- Do NOT add any prefix, explanation, or extra text.

Example output: A large pothole on MG Road, Bangalore is causing traffic hazards and needs immediate repair.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    res.json({ description: text || description });
  } catch (err) {
    console.error('Gemini description error:', err);
    res.json({ description: req.body.description || '' });
  }
}

export async function analyzeImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const imageData = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Analyze this image of a civic issue or infrastructure problem.
Respond with ONLY valid JSON in this exact format (no other text):
{
  "category": "one of: pothole, streetlight, garbage, drainage, water, road, electricity, other",
  "description": "a short 1-2 sentence description of the issue shown"
}`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: imageData,
        },
      },
    ]);

    const text = result.response.text();
    const clean = text.replace(/```json?/g, '').replace(/```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      parsed = {
        category: 'other',
        description: 'A civic issue requiring attention.',
      };
    }

    const validCategories = [
      'pothole', 'streetlight', 'garbage', 'drainage',
      'water', 'road', 'electricity', 'other',
    ];

    if (!validCategories.includes(parsed.category)) {
      parsed.category = 'other';
    }

    res.json({
      category: parsed.category,
      description: parsed.description || 'A civic issue requiring attention.',
    });
  } catch (err) {
    console.error('Gemini API error:', err);
    res.status(500).json({
      error: 'AI analysis failed',
      category: 'other',
      description: 'Unable to analyze image automatically.',
    });
  }
}
