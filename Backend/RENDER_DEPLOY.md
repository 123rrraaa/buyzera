# Backend Deployment — Render.com

This backend is configured for deployment on [Render](https://render.com).

## Environment Variables (set in Render Dashboard)

| Variable | Value |
|---|---|
| `PORT` | `5000` |
| `JWT_SECRET` | `buyzera_super_secret_key_2024_xyz` |
| `CLOUDINARY_CLOUD_NAME` | `dojb6vcfc` |
| `CLOUDINARY_API_KEY` | `151828496757141` |
| `CLOUDINARY_API_SECRET` | *(your secret)* |

## Build Settings

- **Root Directory**: `Backend`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Node Version**: `22`
