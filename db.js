import pkg from 'pg';
const { Pool } = pkg;

import dotenv from 'dotenv';

dotenv.config();

// Configuración del pool de conexiones para PostgreSQL
const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  ssl: {
    rejectUnauthorized: false, // Necesario para conexiones seguras (Railway)
  },
});

// Función genérica para ejecutar consultas
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res.rows;
  } catch (err) {
    console.error('Error ejecutando la consulta:', err.stack);
    throw err;
  } finally {
    client.release();
  }
};

// Crear la tabla `user_data` si no existe
export const initDb = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS user_data (
      user_id TEXT PRIMARY KEY,          -- ID único del usuario
      username TEXT,                     -- Nombre del usuario
      interaction_count INTEGER DEFAULT 0, -- Número de interacciones
      favorite_topic TEXT,               -- Tema favorito del usuario
      last_interaction TIMESTAMP,        -- Fecha de la última interacción
      favorite_game TEXT,                -- Juego favorito del usuario
      mood TEXT,                         -- Último estado de ánimo detectado del usuario
      special_notes TEXT                 -- Notas especiales sobre el usuario
    );
  `;
  await query(queryText);
  console.log('Base de datos inicializada correctamente.');
};

// Guardar o actualizar datos del usuario
export const saveUserInteraction = async (userId, username, userMessage) => {
  const now = new Date().toISOString();
  const topic = detectFavoriteTopic(userMessage || '');
  const game = detectFavoriteGame(userMessage || '');
  const mood = detectMood(userMessage || '');
  const notes = generateNotes(userMessage || '');

  const queryText = `
    INSERT INTO user_data (user_id, username, interaction_count, favorite_topic, last_interaction, favorite_game, mood, special_notes)
    VALUES ($1, $2, 1, $3, $4, $5, $6, $7)
    ON CONFLICT (user_id) DO UPDATE SET
      interaction_count = user_data.interaction_count + 1,
      favorite_topic = COALESCE($3, user_data.favorite_topic),
      last_interaction = $4,
      favorite_game = COALESCE($5, user_data.favorite_game),
      mood = COALESCE($6, user_data.mood),
      special_notes = COALESCE($7, user_data.special_notes);
  `;
  await query(queryText, [userId, username, topic, now, game, mood, notes]);
  console.log(`Interacción registrada para ${username} (${userId}).`);
};

// Obtener datos del usuario
export const getUserData = async (userId) => {
  const queryText = `SELECT * FROM user_data WHERE user_id = $1`;
  const result = await query(queryText, [userId]);
  return result[0] || null;
};

// Detectar tema favorito
export const detectFavoriteTopic = (message) => {
  const topics = {
    juegos: ['juego', 'adivina', 'diversión'],
    seguridad: ['intruso', 'protección', 'alerta'],
    amistad: ['amigo', 'ayuda', 'cariño'],
  };

  for (const [topic, keywords] of Object.entries(topics)) {
    if (keywords.some((keyword) => message.toLowerCase().includes(keyword))) {
      return topic;
    }
  }

  return null;
};

// Detectar juego favorito
export const detectFavoriteGame = (message) => {
  const games = ['Minecraft', 'Among Us', 'Valorant', 'Fortnite', 'League of Legends'];

  const detectedGame = games.find((game) => message.toLowerCase().includes(game.toLowerCase()));
  return detectedGame || 'Desconocido'; // Por defecto
};

// Generar notas especiales
export const generateNotes = (message) => {
  if (message.toLowerCase().includes('experto')) {
    return 'Es experto en configuraciones avanzadas.';
  }
  if (message.toLowerCase().includes('amigo')) {
    return 'Le gusta interactuar con los demás y fomentar la amistad.';
  }
  return 'Ninguna'; // Por defecto
};

// Detectar estado de ánimo
export const detectMood = (message) => {
  // Definir palabras clave asociadas a cada estado de ánimo
  const moods = {
    feliz: ['feliz', 'contento', 'genial', 'alegría', 'emocionado', 'diversión'],
    triste: ['triste', 'deprimido', 'llorar', 'desanimado', 'solitario'],
    enfadado: ['enfadado', 'molesto', 'irritado', 'odio', 'rabia'],
    sorprendido: ['sorprendido', 'asombrado', 'impresionado', 'increíble'],
    relajado: ['relajado', 'tranquilo', 'calma', 'paz'],
    estresado: ['estresado', 'agobiado', 'nervioso', 'preocupado'],
  };

  // Buscar el estado de ánimo basado en las palabras clave
  for (const [mood, keywords] of Object.entries(moods)) {
    if (keywords.some((keyword) => message.toLowerCase().includes(keyword))) {
      return mood;
    }
  }

  return 'neutral'; // Si no se detecta un estado de ánimo, devuelve 'neutral'
};
