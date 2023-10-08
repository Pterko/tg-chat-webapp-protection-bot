# Telegram Chat Webapp Protection Bot

Protect your Telegram chats using the WebApp (MiniApps) Telegram technology enhanced with the power of Recaptcha. This bot supports integration with various captcha providers as per the need.

## Table of Contents

- [Telegram Chat Webapp Protection Bot](#telegram-chat-webapp-protection-bot)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Components](#components)
    - [Frontend](#frontend)
      - [Env Variables](#env-variables)
      - [Development](#development)
      - [Production](#production)
    - [Backend](#backend)
  - [Getting Started](#getting-started)
    - [Frontend Setup](#frontend-setup)
    - [Backend Setup](#backend-setup)

## Features

- **Chat Protection**: Ensure that only genuine users can join your Telegram chat.
- **Allow you to customize chat rules**: Allow you to customize chat rules
## Components

This bot is structured into two core components:
1. Backend: Manages the bot operations.
2. Frontend: A web application interface for Telegram, displaying chat rules and facilitating recaptcha verification.

### Frontend

#### Env Variables

Before running the frontend in either development or production mode, ensure you've set the environment variables. The frontend primarily requires the `VITE_RECAPTCHA_PUBLIC` variable, corresponding to the Recaptcha public key. Obtain this key [here](https://www.google.com/recaptcha/admin).

#### Development

To initiate the frontend in development mode:
1. Run `npm run dev`. This command activates the frontend on your localhost.
2. To make the frontend externally accessible, utilize tools such as `ngrok`, `localtunnel`, or `cloudflared`.
   
For simplification, use `cloudflared`. Follow the installation instructions [here](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/). We've also included a handy script to run cloudflared. Execute `npm run proxy` and you should receive an external link to your frontend.

> **Pro Tip**: For a persistent link, consider setting up a permanent cloudflared tunnel.

#### Production

To deploy in production:

1. Execute `npm run build` to construct the frontend application files.
2. Navigate to Cloudflare Pages and upload the generated files for deployment. 
3. Optionally, link your GitHub repo to Cloudflare pages for automated CI/CD.

### Backend

*Coming Soon...*

## Getting Started

### Frontend Setup

1. Set the environment variable: `VITE_RECAPTCHA_PUBLIC`
2. For development, follow the instructions under [Development](#development).
3. For production, see the instructions under [Production](#production).

### Backend Setup

*Information to be added...*

---

Feel free to contribute and enhance this bot's functionality. Pull requests and suggestions are welcome!
