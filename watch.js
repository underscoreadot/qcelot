import { getCachedGameCounts } from "./hypixel.js";

export async function watchQueue({ channel, role, countThreshold, everyone }) {
  let previousCount = null;
  let last = null;

  const interval = setInterval(async () => {
    try {
      const games = await getCachedGameCounts();
      const count = games.ARCADE.modes.FARM_HUNT;

      if (count >= countThreshold && (previousCount !== null && previousCount < countThreshold) && (!last || Date.now() - last >= 60000)) {
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

        last = Date.now();
      }

      previousCount = count;
    } catch (err) {
      console.error("Error fetching queue details:", err);
    }
  }, 1200);

  return interval;
}
