import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import { GoogleGenAI } from '@google/genai';

const app = express();
// PERBAIKAN: Konfigurasi Multer untuk menyimpan di memori (diperlukan untuk req.file.buffer)
const upload = multer({ storage: multer.memoryStorage() }); 
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = "gemini-2.5-flash";

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server ready on http://localhost:${PORT}`);
});

// --- HELPER FUNCTION UNTUK GAMBAR ---
const fileToGenerativePart = (buffer, mimeType) => {
    return {
        inlineData: {
            data: buffer.toString("base64"),
            mimeType,
        },
    };
};
// --- END HELPER FUNCTION ---


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
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint untuk menghasilkan teks dari gambar dan prompt
app.post('/generate-from-image', upload.single('image'), async (req, res) => {
    const { prompt } = req.body;
    
    // Validasi file
    if (!req.file) {
        return res.status(400).json({ error: "No image file uploaded." });
    }

    // Baris ini sudah ada, sekarang digunakan dalam fungsi helper:
    // const base64Image = req.file.buffer.toString('base64'); 
    
    try {
        // PERBAIKAN: Mengkonversi buffer ke Part yang sesuai
        const imagePart = fileToGenerativePart(req.file.buffer, req.file.mimetype);

        const contents = [imagePart, prompt]; // Menggabungkan gambar dan prompt

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: contents, // Menggunakan array contents
        });

        res.status(200).json({ response: response.text });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// Endpoint untuk chat multiturn (PERBAIKAN UTAMA)
app.post('/api/chat', async (req, res) => {
    // PERBAIKAN: Anggap body request adalah array pesan (messages)
    const messages = req.body;

    try {
        // PERBAIKAN: Validasi langsung pada array messages
        if (!Array.isArray(messages)) {
            // Mengembalikan 400 Bad Request jika format salah
            return res.status(400).json({ error: 'Request body must be an array of message objects: [{ role: "user", text: "..." }, ...]' });
        }

        const contents = messages.map(({ role, text }) => ({
            role,
            parts: [{ text }],
        }));

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents,
        });

        res.status(200).json({ result: response.text });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});