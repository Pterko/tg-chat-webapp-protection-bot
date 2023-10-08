# Telegram Chat Webapp Protection Bot

Secure your Telegram chats using the WebApp (MiniApps) Telegram technology, powered by Recaptcha.

## Table of Contents

- [Telegram Chat Webapp Protection Bot](#telegram-chat-webapp-protection-bot)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Components](#components)
    - [Frontend](#frontend)
      - [Environment Variables](#environment-variables)
      - [Development](#development)
      - [Production](#production)
    - [Backend](#backend)
      - [Environment Variables](#environment-variables-1)
  - [Getting Started](#getting-started)
    - [Frontend Setup](#frontend-setup)
    - [Backend Setup](#backend-setup)
  - [Contribution](#contribution)

## Features

- **Chat Protection**: Ensure only genuine users access your Telegram chat.
- **Customizable Chat Rules**: Modify chat rules to fit your community's needs.

## Components

The bot is structured into two main components:
1. **Frontend**: Provides a user interface on Telegram, showcasing chat rules and handling recaptcha verifications.
2. **Backend**: Oversees bot operations and functionalities.

### Frontend

#### Environment Variables

Before initializing the frontend, set the required environment variables. The key variable is `VITE_RECAPTCHA_PUBLIC`, corresponding to the Recaptcha public key. Obtain it [here](https://www.google.com/recaptcha/admin).

#### Development

To run the frontend in development:
1. Start the frontend on localhost: `npm run dev`.
2. Make it externally accessible using `ngrok`, `localtunnel`, or `cloudflared`.

For convenience, utilize `cloudflared`. Follow the [installation guide](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) and run `npm run proxy` for an external access link.

> **Pro Tip**: Set up a permanent cloudflared tunnel for a consistent access link.

#### Production

To deploy to production:
1. Build the frontend: `npm run build`.
2. Upload and deploy the built files on Cloudflare Pages.
3. Optionally, link your GitHub repository to Cloudflare Pages for continuous integration.

### Backend

#### Environment Variables

Initialize the backend by setting the following variables:

```
BOT_TOKEN=
WEB_APP_URL=
WEB_APP_TG_URI=
MONGO_URI=
RECAPTCHA_SECRET=
REDIS_USERNAME=
REDIS_PASSWORD=
REDIS_HOST=
REDIS_PORT=
```

For running the backend:
- Development mode: `npm run dev`.
- Containerization: Use the provided Dockerfile.
- Production: `npm run build && npm run start`.

*Additional details forthcoming.*

## Getting Started

### Frontend Setup

1. Set the `VITE_RECAPTCHA_PUBLIC` environment variable.
2. For development, see [Frontend Development](#development).
3. For production, refer to [Frontend Production](#production).

### Backend Setup

Follow the [Backend Environment Variables](#backend) instructions and select your deployment method.

## Contribution

Enhance this bot with your contributions! Pull requests, suggestions, and feedback are heartily welcomed. Let's work together to amplify its capabilities!