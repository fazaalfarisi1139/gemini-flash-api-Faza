import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import { GoogleGenAI } from '@google/genai';

const app = express();
const upload = multer();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = "gemini-2.5-flash";

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server ready on http://localhost:${PORT}`);
});

// Endpoint untuk menghasilkan teks dari prompt
app.post('/generate-text', async (req, res) => {
    const { prompt } = req.body;
    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt
        });
        res.status(200).json({ result: response.text });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint untuk menghasilkan teks dari gambar dan prompt (TIDAK LENGKAP)
app.post('/generate-from-image', upload.single('image'), async (req, res) => {
    const { prompt } = req.body;
    
    // Baris ini terlihat di gambar 3, tetapi tidak lengkap karena buffer belum dikonversi
    const base64Image = req.file.buffer.toString('base64'); 
    
    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt, // Perlu diperbaiki agar termasuk gambar
        });

        res.status(200).json({ response: response.text });
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: e.message });
    }
});