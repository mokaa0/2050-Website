const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { Client, GatewayIntentBits } = require('discord.js');
const app = express();

app.use(bodyParser.json());
app.use(express.static('public'));

// حفظ الأكواد الفعالة
let validCodes = {};

// لما يتحقق الكود من الديسكورد ينضاف هنا
app.post('/verify-code', (req, res) => {
    const code = req.body.code;
    if (validCodes[code]) {
        delete validCodes[code];
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

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

// Discord Bot Setup
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', () => {
    console.log(`Bot Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'code') {
        if (interaction.user.id !== '1327694394371084339') {
            await interaction.reply("ليس لديك صلاحية.");
            return;
        }

        const randomCode = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
        validCodes[randomCode] = true;

        await interaction.reply(`كودك هو: ${randomCode}`);
    }
});

client.login('توكن البوت الخاص بك');

app.listen(3000, () => console.log('Server running on http://localhost:3000'));