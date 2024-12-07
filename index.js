import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import { handleDexterIA } from './AI/dexterAI.js';
import { initDb } from './db.js';
dotenv.config();

// Configurar cliente de Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});


(async () => {
  try {
    await initDb();
    console.log('Base de datos inicializada.');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
  }
})();

// Evento: Bot listo
client.once('ready', () => {
  console.log(`Bot conectado como ${client.user.tag}`);
});

// Manejar mensajes en el canal específico
client.on('messageCreate', async (message) => {
  if (message.author.bot) return; // Ignorar mensajes de bots

  // Verificar si el mensaje está en el canal "prueba"
  if (message.channel.name === 'prueba') {
    await handleDexterIA(message); // Redirigir a Dexter AI
  }
});

// Iniciar el bot con el token de Discord
client.login(process.env.DISCORD_TOKEN);
