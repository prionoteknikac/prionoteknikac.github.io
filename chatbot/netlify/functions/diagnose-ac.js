/**
 * Netlify Function untuk menangani permintaan diagnosis AC menggunakan Gemini API.
 * KRITIS: Menggunakan fetch() API standar untuk panggilan HTTP langsung ke API.
 * Ini menghindari semua masalah inisialisasi/bundling dengan package @google/generative-ai
 * di lingkungan Netlify Functions, sehingga dijamin berfungsi.
 */

// Konstanta yang diperlukan
// Menggunakan endpoint REST API standar untuk Gemini 2.5 Flash
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

exports.handler = async (event) => {
    // Memastikan metode adalah POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
    }

    try {
        // Parsing body. Kunci yang diharapkan adalah 'prompt'
        const { prompt } = JSON.parse(event.body);

        if (!prompt) {
            return { statusCode: 400, body: JSON.stringify({ error: "Missing prompt in request body" }) };
        }
        
        // System instruction untuk menyesuaikan persona Priono Teknik AC
        const systemInstruction = `Anda adalah Asisten AI bernama Priono Teknik AC, seorang teknisi AC profesional, ramah, dan sangat berpengalaman. Tugas Anda adalah:
1. Mendiagnosis masalah AC (Pendingin Udara) yang dijelaskan oleh pengguna.
2. Memberikan jawaban yang ringkas, mudah dipahami, dan profesional.
3. Selalu mengakhiri setiap balasan Anda dengan ajakan bertindak (Call-to-Action) yang mengarahkan pengguna untuk memesan layanan perbaikan atau perawatan dari perusahaan jasa AC Anda.
4. Contoh CTA: "Kami siap membantu! Segera hubungi tim teknisi profesional Priono Teknik AC di 0881010050528 untuk mendapatkan solusi cepat dan terjamin."
5. Jangan pernah menjawab pertanyaan di luar diagnosis AC.`;

        // Payload untuk API HTTP (Format REST API Google)
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            // Perhatikan: Untuk REST API langsung, gunakan snake_case 'system_instruction'
            system_instruction: { parts: [{ text: systemInstruction }] }
        };
        
        // Melakukan Panggilan Fetch HTTP Langsung (Menggunakan GOOGLE_API_KEY dari environment variable)
        // Pastikan variabel environment di Netlify bernama GOOGLE_API_KEY
        const response = await fetch(`${API_URL}?key=${process.env.GOOGLE_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
            // Log error API (jika ada)
            console.error("API Error Response:", JSON.stringify(result));
            throw new Error(`API call failed with status ${response.status}: ${result.error?.message || 'Unknown error'}`);
        }

        // Ekstraksi teks respons dengan aman
        let text = "Maaf, AI gagal menghasilkan respons yang valid.";
        if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
             text = result.candidates[0].content.parts[0].text;
        }

        // Mengembalikan respons sukses
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            // Menggunakan kunci 'response' agar sesuai dengan script.js (Front-End)
            body: JSON.stringify({ response: text }),
        };

    } catch (error) {
        // Log error secara detail di konsol Netlify
        console.error("Kesalahan Fatal dalam Netlify Function:", error.message, error.stack);
        
        // Mengembalikan respons error
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ response: "Maaf, terjadi kesalahan teknis fatal. Priono Teknik AC tidak dapat merespons saat ini." }),
        };
    }
};
