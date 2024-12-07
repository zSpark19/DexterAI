import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Inicializar la base de datos
export const initDb = async () => {
  const db = await open({
    filename: './data.db', // Nombre del archivo de la base de datos
    driver: sqlite3.Database,
  });

  // Crear la tabla `user_data` si no existe
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_data (
      user_id TEXT PRIMARY KEY,          -- ID único del usuario
      username TEXT,                     -- Nombre del usuario
      interaction_count INTEGER DEFAULT 0, -- Número de interacciones
      favorite_topic TEXT,               -- Tema favorito del usuario
      last_interaction TEXT,              -- Fecha de la última interacción
      favorite_game TEXT,                  -- Juego favorito del usuario
       mood TEXT,                           -- Último estado de ánimo detectado del usuario
       special_notes TEXT                   -- Notas especiales sobre el usuario
      )
     `);

  console.log('Base de datos inicializada correctamente.');
  return db;
};

// Guardar o actualizar datos del usuario
export const saveUserInteraction = async (userId, username, userMessage) => {
  const db = await initDb();
  const now = new Date().toISOString();
  const topic = detectFavoriteTopic(userMessage || '');
  const game = detectFavoriteGame(userMessage || '');
  const mood = detectMood(userMessage || '');
  const notes = generateNotes(userMessage || '');

  await db.run(
    `
    INSERT INTO user_data (user_id, username, interaction_count, favorite_topic, last_interaction, favorite_game, mood, special_notes)
    VALUES (?, ?, 1, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      interaction_count = interaction_count + 1,
      favorite_topic = COALESCE(?, favorite_topic),
      last_interaction = ?,
      favorite_game = COALESCE(?, favorite_game),
      mood = COALESCE(?, mood),
      special_notes = COALESCE(?, special_notes)
    `,
    [userId, username, topic, now, game, mood, notes, topic, now, game, mood, notes]
  );
  console.log(`Interacción registrada para ${username} (${userId}).`);
  await db.close();
};

// Obtener datos del usuario
export const getUserData = async (userId) => {
  const db = await initDb();
  const user = await db.get(`SELECT * FROM user_data WHERE user_id = ?`, [userId]);
  await db.close();

  return user || null;
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
export const detectFavoriteGame = (message) => {
    const games = ['Minecraft', 'Among Us', 'Valorant', 'Fortnite', 'League of Legends'];
    
    const detectedGame = games.find((game) => message.toLowerCase().includes(game.toLowerCase()));
    return detectedGame || 'Desconocido'; // Por defecto
  };
  
  export const generateNotes = (message) => {
    if (message.toLowerCase().includes('experto')) {
      return 'Es experto en configuraciones avanzadas.';
    }
    if (message.toLowerCase().includes('amigo')) {
      return 'Le gusta interactuar con los demás y fomentar la amistad.';
    }
    return 'Ninguna'; // Por defecto
  };
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
  