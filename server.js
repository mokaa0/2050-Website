require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const app = express();

app.use(bodyParser.json());
app.use(express.static('public'));

// الأكواد الصالحة للتفعيل
let validCodes = {};

// تحقق من الكود عند إدخاله بالموقع
app.post('/verify-code', (req, res) => {
    const code = req.body.code;
    if (validCodes[code]) {
        delete validCodes[code]; // يستخدم مرة واحدة فقط
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// عند الضغط على زر التوريد
app.post('/supply-users', (req, res) => {
    const code = req.body.code;

    if (validCodes[code] !== undefined) {
        return res.json({ success: false, message: "الكود هذا غير مفعل أو تم استهلاكه." });
    }

    const users = JSON.parse(fs.readFileSync('users.json'));
    const selected = [];

    while (selected.length < 20 && users.length > 0) {
        const index = Math.floor(Math.random() * users.length);
        selected.push(users.splice(index, 1)[0]);
    }

    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
    res.json({ success: true, users: selected });
});

// إعداد بوت الديسكورد
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', () => {
    console.log(`Bot Logged in as ${client.user.tag}`);
});

// الأمر الخاص بـ code
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'code') {
        if (interaction.user.id !== process.env.OWNER_ID) {
            await interaction.reply("ليس لديك صلاحية.");
            return;
        }

        const randomCode = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
        validCodes[randomCode] = true;

        await interaction.reply(`كودك هو: ${randomCode}`);
    }
});

// تسجيل أمر السلاش /code
async function registerSlashCommand() {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const command = new SlashCommandBuilder()
        .setName('code')
        .setDescription('توليد كود عشوائي للموقع');

    try {
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: [command.toJSON()] }
        );
        console.log('Slash command registered.');
    } catch (err) {
        console.error(err);
    }
}

client.login(process.env.DISCORD_TOKEN);
registerSlashCommand();

app.listen(3000, () => console.log('Server running on http://localhost:3000'));