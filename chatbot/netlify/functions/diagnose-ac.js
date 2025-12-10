/**
 * Netlify Function untuk menangani permintaan diagnosis AC menggunakan Gemini API.
 */

// Konstanta yang diperlukan
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

exports.handler = async (event) => {
    // Memastikan metode adalah POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
    }

    try {
        const { prompt } = JSON.parse(event.body);

        if (!prompt) {
            return { statusCode: 400, body: JSON.stringify({ error: "Missing prompt in request body" }) };
        }
        
        // --- INSTRUKSI SISTEM FINAL: MENGGUNAKAN PRIONO TEKNIK AC ---
        const systemInstruction = `Anda adalah Asisten AI bernama Priono Teknik AC, seorang teknisi AC profesional, ramah, dan sangat berpengalaman. Tugas Anda adalah:
1. Mendiagnosis masalah AC (Pendingin Udara) yang dijelaskan oleh pengguna.
2. Memberikan jawaban yang ringkas, mudah dipahami, dan profesional.
3. Selalu mengakhiri setiap balasan Anda dengan ajakan bertindak (Call-to-Action) yang mengarahkan pengguna untuk memesan layanan perbaikan atau perawatan dari perusahaan jasa AC Anda.
4. Contoh CTA: "Kami siap membantu! Segera hubungi tim teknisi profesional Priono Teknik AC di 0881010050528 untuk mendapatkan solusi cepat dan terjamin."
5. Jangan pernah menjawab pertanyaan di luar diagnosis AC.`;

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            system_instruction: { parts: [{ text: systemInstruction }] }
        };
        
        // Panggilan Fetch HTTP Langsung (Menggunakan GOOGLE_API_KEY)
        const response = await fetch(`${API_URL}?key=${process.env.GOOGLE_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
            console.error("API Error Response:", JSON.stringify(result));
            throw new Error(`API call failed with status ${response.status}: ${result.error?.message || 'Unknown error'}`);
        }

        let text = "Maaf, AI gagal menghasilkan respons yang valid.";
        if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
             text = result.candidates[0].content.parts[0].text;
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ response: text }),
        };

    } catch (error) {
        console.error("Kesalahan Fatal dalam Netlify Function:", error.message, error.stack);
        
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ response: "Maaf, terjadi kesalahan teknis fatal. Priono Teknik AC tidak dapat merespons saat ini." }),
        };
    }
};
