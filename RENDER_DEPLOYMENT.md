# Render Deployment Guide

## Quick Deploy

This project is configured with `render.yaml` for easy deployment.

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Add Render configuration"
git push origin main
```

### Step 2: Connect to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository: `omarbelo23/deploy-hr`
4. Render will automatically detect `render.yaml`

### Step 3: Add Environment Secrets

⚠️ **IMPORTANT**: Before deploying, add these secret environment variables in the Render Dashboard:

| Key | Value | Notes |
|-----|-------|-------|
| `MONGODB_URI` | `mongodb+srv://hrDB:hrsystem@hr-system.t34efzh.mongodb.net/hr?retryWrites=true&w=majority` | Your MongoDB connection string |
| `JWT_SECRET` | `your-super-secure-random-string-here` | **Change from "1234"** to a secure value! |

**How to add secrets:**
1. After creating the service, go to your service page
2. Click **"Environment"** in the left sidebar
3. Click **"Add Environment Variable"**
4. Add each secret variable listed above
5. Click **"Save Changes"**

### Step 4: Deploy

- Render will automatically build and deploy your app
- Your backend will be available at: `https://hr-system-backend.onrender.com`

### Step 5: Update Frontend CORS

After deployment, update `backend/src/main.ts` to include your Render URL in CORS:

```typescript
app.enableCors({
  origin: [
    'http://localhost:3000', 
    'https://rry-hr-system.netlify.app',
    'https://hr-system-backend.onrender.com' // Add your Render URL
  ],
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

## Configuration Details

### Automatic Configuration (from render.yaml)

- **Build Command**: `cd backend && npm install && npm run build`
- **Start Command**: `cd backend && npm run start:prod`
- **Region**: Oregon (can be changed in render.yaml)
- **Auto-deploy**: Enabled on git push

### Environment Variables Set Automatically

- `NODE_ENV=production`
- `PORT=10000` (Render assigns this automatically)
- `JWT_EXPIRES_IN=24h`

## Free Tier Limitations

⚠️ **Free instances**:
- Spin down after 15 minutes of inactivity
- Take ~30 seconds to wake up on first request
- No SSH access, scaling, or persistent disks

💡 **Upgrade to Starter ($7/month)** for:
- Zero downtime
- SSH access
- Horizontal scaling
- One-off jobs
- Persistent disks

## Troubleshooting

### App not responding
- Check logs in Render Dashboard
- Verify all environment variables are set
- Ensure MongoDB connection string is correct

### CORS errors
- Add your Render backend URL to CORS origins in `main.ts`
- Redeploy after making changes

### Database connection issues
- Verify MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- Check if MONGODB_URI is set correctly in environment variables

## Manual Deploy (Alternative)

If you prefer not to use `render.yaml`:

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect repository: `omarbelo23/deploy-hr`
4. Configure:
   - **Name**: `hr-system-backend`
   - **Region**: Oregon (or your choice)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
5. Add environment variables (see Step 3 above)
6. Click **"Create Web Service"**

## Monitoring

- View logs: Render Dashboard → Your Service → Logs
- Monitor metrics: Render Dashboard → Your Service → Metrics
- Set up alerts: Render Dashboard → Your Service → Alerts

## Support

For issues, check:
- [Render Documentation](https://render.com/docs)
- [NestJS Deployment Guide](https://docs.nestjs.com/faq/serverless)
