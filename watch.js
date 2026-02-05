import { getCachedGameCounts } from "./hypixel.js";

export async function watchQueue({ channel, role, countThreshold, everyone }) {
  let ticks = 0;
  let queued = true;

  const interval = setInterval(async () => {
    try {
      const games = await getCachedGameCounts();
      const count = games.ARCADE.modes.FARM_HUNT;

      if (queued) {
        if (count < countThreshold) ticks++;
        else ticks = 0;

        if (ticks >= 250) {
          ticks = 25;
          queued = false;
        }
      }
      else {
        if (count >= countThreshold) ticks--;
        else ticks = 25;

        if (ticks <= 0) {
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

          ticks = 0;
          queued = true;
        }
      }
    } catch (err) {
      console.error("Error fetching queue details:", err);
    }
  }, 1200);

  return interval;
}
