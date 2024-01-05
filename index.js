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

const gameEmbed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle("New Free Game on Epic Store!");

const announcementEmbed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle(":white_check_mark: Welcome to EpicFree v0.2!")
    .setAuthor({name: "Epic Free"})

const job = new CronJob(
    '5 16 * * 4',
    function(){
        fetchFreeGames();
    },
    null,
    true,
    'GMT'
)

// Initialising Epic API
const epicAPI = axios.create({
    baseURL: "https://store-site-backend-static.ak.epicgames.com/",
})

// Fetching current free games from Epic Store and send it to all Discord groups
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
                gameEmbed.setDescription(description);
                gameEmbed.setThumbnail(game.keyImages[0].url);
                channel.map(m => m.send({
                    embeds:[gameEmbed],
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
    retrieveNextScheduledJob();
}

// Announcing newest update after restarting the bot
const startUpdateAnnouncement = () => {

    announcementEmbed.setDescription("Thank you for using EpicFree! If you see this messages, means that the bot has been reployed or updated, so don't worry nothing is wrong! Please check the following update note for more information.")
    announcementEmbed.addFields(
        {name: " ", value: "\u200b"},
        {name: ":o: New Button!", value: "A new button has been added below the embedded updates to redirect you to Epic Store game page."},
        {name: " ", value: "\u200b"},
        {name: ":o: Delay Added!", value: "A 5 minutes delay has been update before dropping the newest free game to ensure that the API has been fully updated before accessing."},
        {name: " ", value: "\u200b"},
        {name: ":o: No more daily, now weekly!", value: `Now the daily free games have ended. The bot will update weekly. Next free game would be available on ${job.nextDate().toISODate()} 16:00:00 GMT. Mark your calendar!`},
        {name: " ", value: "\u200b"},
    )
    announcementEmbed.setFooter({text: 'Developed by steven-appdev', iconURL: client.user.displayAvatarURL()});
    announcementEmbed.setTimestamp();

    client.guilds.cache.forEach(guild => {
        const channel = guild.channels.cache.filter(channel => channel.name === "bot-automation")
        channel.map(m => m.send({
            embeds:[announcementEmbed]
        }));
    })
}

// Retrieving next scheduled job
const retrieveNextScheduledJob = () => {
    console.log(`Next job will execute on: ${job.nextDate().toISODate()}`);
}

client.on("ready", () => {
    console.log(`${client.user.tag} is online!`);
    startUpdateAnnouncement();
    retrieveNextScheduledJob();
});

client.login(process.env.DISCORD_TOKEN_TEST);