import dotenv from 'dotenv'
import axios from 'axios';
import { CronJob } from 'cron';
dotenv.config()

import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const epicAPI = axios.create({
    baseURL: "https://store-site-backend-static.ak.epicgames.com/",
})

const fetchFreeGames = async () => {
    let response = await epicAPI.get("freeGamesPromotions");
    client.guilds.cache.forEach(guild => {
        const channel = guild.channels.cache.filter(channel => channel.name === "bot-automation")
        response.data.data.Catalog.searchStore.elements.forEach(game => {
            if(game.expiryDate != null)
            {
                let description = `
                    **${game.title}** is now free on Epic Store!\n
                    Grab it now before **${new Date(game.expiryDate).toUTCString()}**!
                `
                let storeURL = `https://store.epicgames.com/en-US/p/${game.productSlug}`
                embed.setDescription(description);
                embed.setThumbnail(game.keyImages[0].url);
                channel.map(m => m.send({
                    embeds:[embed],
                    components:[{
                        "type": 1,
                        "components": [
                            {
                                "type": 2,
                                "label": "Visit Game Page on Epic Store",
                                "style": 5,
                                "url": storeURL
                            }
                        ]
            
                    }]
                }));
            }
        })
    })
    console.log(`Next job will execute on: ${job.nextDate()}`);
}

const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle("New Free Game on Epic Store!");

const job = new CronJob(
    '5 16 * * *',
    function(){
        fetchFreeGames();
    },
    null,
    true,
    'GMT'
)

client.login(process.env.DISCORD_TOKEN);

client.on("ready", () => {
    console.log(`${client.user.tag} is online!`);
    fetchFreeGames();
});