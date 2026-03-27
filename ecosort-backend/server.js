require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const rateLimit = require('express-rate-limit');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support large base64 strings

// Rate Limiting: 250 requests per day per IP
const limiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 250,
  message: { error: 'Daily request limit exceeded. Please try again tomorrow.' },
});
app.use(limiter);

// Setup Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const systemInstruction = `You are an expert environmental waste analysis AI.
FIRST, determine if the main subject of the image is household, recyclable, hazardous, or electronic waste/garbage. If it is NOT waste (e.g., it is a person, a pet, clean furniture, a landscape), set a new Boolean field isWaste to false, keep all other arrays empty, and set the composition field to 'NON-WASTE OBJECT DETECTED'. Otherwise, set isWaste to true and proceed with detailed analysis as per the schema.

Analyze the uploaded image of waste and return ONLY a valid JSON object. Do not use markdown formatting like \`\`\`json.
Use exactly this JSON schema. If isWaste is true, you MUST provide 4 to 5 detailed bullet points for impact and risks, and you MUST provide 3 to 4 detailed disposalSteps. 

{
  "isWaste": true,
  "composition": "e.g., 40% PLASTIC, 35% E-WASTE, 25% CARDBOARD",
  "impact": [
    "Detailed point 1 about environmental damage",
    "Detailed point 2 about pollution and leaching",
    "Detailed point 3 about landfill burden",
    "Detailed point 4 about long-term effects"
  ],
  "risks": [
    "Detailed point 1 about risks to wildlife",
    "Detailed point 2 about soil/water contamination",
    "Detailed point 3 about toxic exposure",
    "Detailed point 4 about human health hazards"
  ],
  "disposalSteps": [
    "Step 1: Clear instruction on how to segregate this waste at home",
    "Step 2: Specific recycling guidelines for these materials",
    "Step 3: Warnings about what NOT to do (e.g., do not mix with wet waste)",
    "Step 4: Where to drop off hazardous parts like E-Waste"
  ]
}`;

app.post('/api/analyze', async (req, res) => {
  try {
    let { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing base64 image data' });
    }

    // Strip out the data URI prefix if it exists
    if (imageBase64.includes('base64,')) {
      imageBase64 = imageBase64.split('base64,')[1];
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemInstruction,
      generationConfig: {
        responseMimeType: 'application/json' // enforces json output format
      }
    });

    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBase64,
          mimeType: 'image/jpeg'
        }
      },
      {
        text: `Analyze the waste in this image. You MUST return ONLY a raw JSON object. Do NOT use markdown.
You MUST provide 4 to 5 short, impactful points for impact and risks. Keep each point under 10 words.
For the "disposalSteps" array, you MUST provide ONE specific segregation instruction for EACH material detected. Start each step with the MATERIAL NAME in ALL CAPS followed by a colon.

Use EXACTLY this JSON format:
{
  "composition": "45% PAPER, 35% PLASTIC, 20% METAL",
  "impact": ["Pollutes groundwater with heavy metals", "Releases toxic fumes if burned", "Occupies landfill space for decades", "Harms local plant ecosystems"],
  "risks": ["Poisonous to stray animals", "Contaminates drinking water sources", "Causes severe human health issues", "Dangerous chemical leaching in soil"],
  "disposalSteps": [
    "PAPER: Keep dry, fold flat, and put in the dry paper bin.", 
    "PLASTIC: Rinse any food residue and place in dry recyclables.", 
    "METAL: Do not crush aerosol cans; drop off at metal scrap."
  ]
}`
      }
    ]);

    const responseText = result.response.text();
    let jsonResult;
    try {
      const cleanText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      jsonResult = JSON.parse(cleanText);
    } catch (parseErr) {
      console.error("Failed to parse JSON response:", responseText);
      return res.status(500).json({ error: 'Failed to process AI response properly. It was not valid JSON.' });
    }

    res.json(jsonResult);
  } catch (error) {
    if (error.status === 429 || (error.message && (error.message.includes('429') || error.message.includes('quota') || error.message.includes('Too Many Requests')))) {
      return res.status(429).json({ error: 'API_LIMIT', message: 'Please wait a few seconds before scanning again.' });
    }
    console.error('Error analyzing image:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`EcoSort AI backend running on all network interfaces (Port: ${port})`);
});