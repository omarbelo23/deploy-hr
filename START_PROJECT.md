# How to Start the Payroll System Project

This guide will help you start both the backend and frontend of the Payroll Configuration System.

## Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)
- **MongoDB** (running locally or connection string)

## Step 1: Install Dependencies

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## Step 2: Configure Backend

The backend runs on **port 3000** by default. Make sure MongoDB is running and accessible.

**IMPORTANT:** You must create a `.env` file in the `backend` directory with the MongoDB connection string.

Create a file named `.env` in the `backend` directory with the following content:

```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/payroll-system

# Server Port
PORT=3000

# JWT Secret (change this to a secure random string in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**Note:** 
- If your MongoDB is running on a different port or host, update `MONGO_URI` accordingly
- For MongoDB Atlas (cloud), use: `mongodb+srv://username:password@cluster.mongodb.net/payroll-system`
- Make sure MongoDB is running before starting the backend

## Step 3: Start the Backend

Open a terminal and run:

```bash
cd backend
npm run start:dev
```

The backend will start on **http://localhost:3000** (or the port specified in your environment).

You should see output like:
```
[Nest] INFO  [NestFactory] Starting Nest application...
[Nest] INFO  [InstanceLoader] AppModule dependencies initialized
[Nest] INFO  [NestFactory] Nest application successfully started
```

## Step 4: Start the Frontend

Open a **new terminal** (keep the backend running) and run:

```bash
cd frontend
npm run dev
```

The frontend will start on **http://localhost:3000** (Next.js default port).

**Note:** If you get a port conflict, Next.js will automatically use the next available port (usually 3001).

## Step 5: Configure Frontend API URL

If your backend is running on a different port, update the API base URL in `frontend/src/lib/api.ts`:

```typescript
const API_BASE_URL = 'http://localhost:3000'; // Change this to match your backend port
```

Or set the environment variable:
```bash
# In frontend directory, create .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Step 6: Access the Application

1. Open your browser and navigate to **http://localhost:3000** (or the port shown in the terminal)
2. You should see the Payroll Configuration Dashboard
3. Use the navigation bar to access different configuration pages

## Troubleshooting

### Backend Issues

- **MongoDB Connection Error**: Make sure MongoDB is running
  ```bash
  # Check if MongoDB is running
  mongosh
  ```

- **Port Already in Use**: Change the port in `backend/src/main.ts` or set `PORT` environment variable

### Frontend Issues

- **API Connection Error**: 
  - Verify backend is running on the correct port
  - Check CORS settings in backend if you see CORS errors
  - Update `API_BASE_URL` in `frontend/src/lib/api.ts`

- **Authentication Error**: 
  - The frontend expects a JWT token in `localStorage.getItem('authToken')`
  - You'll need to implement login functionality or manually set a token for testing

### Port Conflicts

If port 3000 is already in use:
- **Backend**: Set `PORT=3001` in backend `.env` file
- **Frontend**: Next.js will automatically use the next available port, or set it explicitly:
  ```bash
  npm run dev -- -p 3001
  ```
  Then update `API_BASE_URL` in the frontend to match your backend port.

## Quick Start Commands Summary

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run start:dev

# Terminal 2 - Frontend  
cd frontend
npm install
npm run dev
```

## Development Scripts

### Backend
- `npm run start:dev` - Start in development mode with hot reload
- `npm run start` - Start in production mode
- `npm run build` - Build for production
- `npm run test` - Run tests

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run linter

## Next Steps

1. **Set up Authentication**: Implement login functionality to get JWT tokens
2. **Configure MongoDB**: Ensure your database connection is properly configured
3. **Test the API**: Use the frontend to create, edit, and manage payroll configurations
4. **Review Permissions**: Check that role-based access control is working correctly

