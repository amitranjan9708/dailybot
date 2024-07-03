const Telegraf = require('telegraf').Telegraf;
const message = require('telegraf/filters').message;
const { GoogleGenerativeAI } = require('@google/generative-ai');
const eventSchema = require('./src/models/Event.js');
const userModel = require('./src/models/User');
const connectDb = require('./src/config/db.js');

require('dotenv').config();

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const bot = new Telegraf(process.env.BOT_TOKEN);

try {
  connectDb();
  console.log("Database connected successfully");
} catch (err) {
  console.log(err);
  process.kill(process.pid, 'SIGTERM');
}

bot.start(async (ctx) => {
  const from = ctx.update.message.from;

  try {
    await userModel.findOneAndUpdate({ tgId: from.id }, {
      $setOnInsert: {
        firstName: from.first_name,
        lastName: from.last_name,
        isBot: from.is_bot,
        username: from.username,
      },
    }, { upsert: true, new: true });

    await ctx.reply(`Hi ${from.first_name}`);
  } catch (err) {
    console.log(err);
    await ctx.reply('Facing difficulties');
  }
});

bot.command('generate', async (ctx) => {
  const from = ctx.update.message.from;

  
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const events = await eventSchema.find({
      tgId: from.id,
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    if (events.length === 0) {
      await ctx.reply('No events for the day');
      return;
    }

    const prompt = `Write three separate posts for LinkedIn, Instagram, and Twitter based on today's activities: ${events.map((event) => event.text).join(', ')}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
   console.log(text);
   console.log(response);
    await ctx.reply(text);
  } catch (err) {
    console.log(err);
    await ctx.reply('Error occurred while generating text');
  }
});

bot.command('cleartext', async (ctx) => {
  const from = ctx.update.message.from;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  try {
    await eventSchema.deleteMany({
      tgId: from.id,
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    await ctx.reply('All events for the day have been cleared.');
  } catch (err) {
    console.log(err);
    await ctx.reply('Error occurred while clearing events');
  }
});

bot.on(message('sticker'),(ctx)=>{
    console.log('sticker',ctx.update.message);
})

bot.on(message('text'), async (ctx) => {
  const from = ctx.update.message.from;
  const message = ctx.update.message.text;

  try {
    await eventSchema.create({
      text: message,
      tgId: from.id,
    });

    ctx.reply(`Well noted, ${from.first_name}, keep texting me your thoughts. To generate the posts, just type '/generate' in the message box or use /cleartext to clear the full events data of the day`);
  } catch (err) {
    console.log(err);
    await ctx.reply('Facing difficulties, please try again later');
  }
});

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
