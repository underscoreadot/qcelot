import 'dotenv/config';
import express from 'express';
import {
  ButtonStyleTypes,
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  MessageComponentTypes,
  verifyKeyMiddleware,
} from 'discord-interactions';
import { watchQueue } from './watch.js';
import { getCachedGameCounts } from "./hypixel.js";

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// To keep track of our active games
const watchers = new Map();

import pkg from 'discord.js';
const { Client, GatewayIntentBits } = pkg;
const client = new Client({ intents: [ 'GUILDS', 'GUILD_MESSAGES' ] });

client.login(process.env.DISCORD_TOKEN);

client.once('ready', () => {
  client.user.setPresence({
    status: 'invisible'
  });
});

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
  // Interaction id, type and data
  const { id, type, data } = req.body;

  let everyone = null;

  if (req.body.guild) {
    const guild = await client.guilds.fetch(req.body.guild.id);
    everyone = guild.roles.everyone.id;
  }

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    // "check" command
    if (name === 'check') {
      const games = await getCachedGameCounts();
      const count = games.ARCADE.modes.FARM_HUNT;

      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          embeds: [
            {
              title: `Farm Hunt is ` + (count < 11 ? `not ` : ``) + `queueing!`,
              fields: [
                { name: `Count`, value: `${count} player` + (count !== 1 ? `s` : ``), inline: true }
              ],
              color: 0x5a9d12
            }
          ]
        }
      });
    }

    // "watch" command
    if (name === 'watch') {
      if (req.body.member && !(BigInt(req.body.member.permissions) & 1n << 5n)) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            embeds: [
              {
                title: `Permission denied!`,
                description: `You do not have permission to use this command.`,
                color: 0x55535d
              }
            ],
            flags: InteractionResponseFlags.EPHEMERAL
          }
        });
      }
      
      if (watchers.get(req.body.channel_id)) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            embeds: [
              {
                title: `Channel in use!`,
                description: `This channel is already being used to watch queues.`,
                color: 0x55535d
              }
            ]
          }
        });
      }

      const role = data.options?.find(o => o.name === 'role')?.value;
      const countThreshold = data.options?.find(o => o.name === 'count')?.value || 11;

      const channel = await client.channels.fetch(req.body.channel_id);

      watchers.set(req.body.channel_id, watchQueue({ channel: channel, role: role, countThreshold: countThreshold, everyone: everyone }));

      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          embeds: [
            {
              title: `Started watching the queues for Farm Hunt!`,
              description: `Notifications will be sent ` + (role ? (role === everyone ? `to @everyone ` : `to <@&${role}> `) : ``) + `when the player count reaches ${countThreshold}.`,
              color: 0xb97374
            }
          ]
        }
      });
    }

    // "unwatch" command
    if (name === 'unwatch') {
      if (req.body.member && !(BigInt(req.body.member.permissions) & 1n << 5n)) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            embeds: [
              {
                title: `Permission denied!`,
                description: `You do not have permission to use this command.`,
                color: 0x55535d
              }
            ],
            flags: InteractionResponseFlags.EPHEMERAL
          }
        });
      }

      const watcher = watchers.get(req.body.channel_id);

      if (watcher) {
        clearInterval(watcher);
        watchers.delete(req.body.channel_id);
      }

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          embeds: [
            {
              title: `Stopped watching the queues for Farm Hunt!`,
              description: `Notifications will no longer be sent.`,
              color: 0xb97374
            }
          ]
        }
      });
    }

    console.error(`unknown command: ${name}`);
    return res.status(400).json({ error: 'unknown command' });
  }

  console.error('unknown interaction type', type);
  return res.status(400).json({ error: 'unknown interaction type' });
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
