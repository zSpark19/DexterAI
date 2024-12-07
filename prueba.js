const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

// Configurar OpenAI
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY, // Coloca tu clave directamente aquí si no usas .env
});
const openai = new OpenAIApi(configuration);

// Prueba de llamada a OpenAI
(async () => {
    try {
        const response = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo', // Cambia a 'gpt-4' si tienes acceso
            messages: [
                { role: 'system', content: 'Eres un bot de prueba.' },
                { role: 'user', content: 'Dime algo interesante.' },
            ],
        });
        console.log(response.data.choices[0].message.content);
    } catch (error) {
        console.error('Error:', error.message);
    }
})();
