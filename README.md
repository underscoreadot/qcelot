# Qcelot
A Discord queue tracker and notifier for games on the Hypixel network!

## Installation
Qcelot requires Node.js v18 or later and a publicly accessible interaction endpoint. Consult the [Discord Developer Documentation](https://docs.discord.com/developers/intro) for guidance on setting up your bot and interaction endpoint.

Clone the repository and install dependencies with:
```
git clone https://github.com/Qcelot/qcelot.git
cd qcelot
npm install
```
Create a `.env` file containing your app ID (`APP_ID`), bot token (`DISCORD_TOKEN`), public key (`PUBLIC_KEY`), and Hypixel API key (`HYPIXEL_API_KEY`).

Install slash commands using:
```
npm run register 
```
Then start the bot with:
```
npm run start
```

## Contributing
Contributions are welcome! Please fork the repository and submit a pull request.