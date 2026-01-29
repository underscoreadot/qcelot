import { getCachedGameCounts } from "./hypixel.js";

export async function watchQueue({ channel, role, countThreshold, delay, everyone }) {
  let previousCount = null;
  let ticks = 25;
  let last = Date.now() - delay * 60000;

  const interval = setInterval(async () => {
    try {
      const games = await getCachedGameCounts();
      const count = games.ARCADE.modes.FARM_HUNT;

      if (count >= countThreshold && (Date.now() - last) >= delay * 60000 && ((previousCount !== null && previousCount < countThreshold) || ticks < 25)) ticks--;
      else ticks = 25;

      if (ticks === 0) {
        await channel.send({
          content: role ? (role === everyone ? `@everyone` : `<@&${role}>`) : ` `,
          embeds: [
            {
              title: `Farm Hunt is queueing!`,
              fields: [
                { name: `Count`, value: `${count} players`, inline: true }
              ],
              color: 0x5a9d12
            }
          ]
        });

        ticks = 25;
        last = Date.now();
      }

      previousCount = count;
    } catch (err) {
      console.error("Error fetching queue details:", err);
    }
  }, 1200);

  return interval;
}
