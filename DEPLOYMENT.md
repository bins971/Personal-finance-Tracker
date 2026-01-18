# Deploy to Netlify - Complete Guide

Your Personal Finance Tracker is now configured as a full-stack Netlify application with serverless functions!

## Quick Start

### 1. Install Netlify CLI (if not already installed)
```bash
npm install -g netlify-cli
```

### 2. Test Locally with Netlify Dev
```bash
netlify dev
```
This will:
- Start the React frontend on port 8888
- Run serverless functions locally
- Simulate the production environment

### 3. Deploy to Netlify

#### Option A: Deploy via Netlify UI (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Convert to Netlify Functions"
   git push
   ```

2. **Go to [netlify.com](https://netlify.com)** and log in

3. **Import your project**:
   - Click "Add new site" → "Import an existing project"
   - Choose "Deploy with GitHub"
   - Select your `Personal-finance-Tracker` repository

4. **Configure build settings** (should auto-detect from `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `build`
   - Functions directory: `netlify/functions`

5. **Add Environment Variables**:
   Go to Site settings → Environment variables and add:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   GEMINI_API_KEY=your_gemini_api_key
   NODE_ENV=production
   ```

6. **Deploy** - Click "Deploy site"

#### Option B: Deploy via Netlify CLI

```bash
# Login to Netlify
netlify login

# Link to existing site or create new one
netlify init

# Set environment variables
netlify env:set MONGODB_URI "your_mongodb_connection_string"
netlify env:set JWT_SECRET "your_jwt_secret_key"
netlify env:set GEMINI_API_KEY "your_gemini_api_key"
netlify env:set NODE_ENV "production"

# Deploy to production
netlify deploy --prod
```

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secret-key-here` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` |
| `NODE_ENV` | Environment mode | `production` |

### How to Get These Values

1. **MONGODB_URI**: 
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string

2. **JWT_SECRET**: 
   - Generate a random string (at least 32 characters)
   - You can use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

3. **GEMINI_API_KEY**:
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create an API key

---

## Testing Your Deployment

### 1. Test Serverless Functions Locally

```bash
# Start Netlify Dev
netlify dev

# Your app will be available at http://localhost:8888
# Functions will be at http://localhost:8888/.netlify/functions/
```

### 2. Test Individual Functions

```bash
# Test auth function
curl http://localhost:8888/.netlify/functions/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 3. After Deployment

Visit your Netlify URL and test:
- ✅ Sign up for a new account
- ✅ Log in
- ✅ Add expenses and budgets
- ✅ Create goals
- ✅ Use AI Financial Advisor
- ✅ Manage subscriptions

---

## Troubleshooting

### Issue: Functions not working after deployment

**Solution**:
1. Check Netlify function logs: Site → Functions → View logs
2. Verify environment variables are set correctly
3. Check MongoDB connection string is correct

### Issue: "Database connection failed"

**Solution**:
1. Verify `MONGODB_URI` is set in Netlify environment variables
2. Check MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
3. Ensure your MongoDB user has read/write permissions

### Issue: "AI configuration error: Missing API Key"

**Solution**:
1. Verify `GEMINI_API_KEY` is set in Netlify
2. Check the API key is valid in Google AI Studio
3. Ensure the key has proper permissions

### Issue: Cold starts are slow

**Explanation**: Serverless functions "sleep" after inactivity and take 1-2 seconds to "wake up" on the first request. This is normal for free tier.

**Solutions**:
- Upgrade to Netlify Pro for faster cold starts
- Or accept the 1-2 second delay on first request

### Issue: Build fails

**Solution**:
1. Check build logs in Netlify dashboard
2. Ensure all dependencies are in `package.json`
3. Try building locally first: `npm run build`

---

## Continuous Deployment

Once connected to GitHub, Netlify will automatically:
- Deploy on every push to your main branch
- Run build checks on pull requests
- Provide deploy previews for branches

To disable auto-deploy:
- Go to Site settings → Build & deploy → Continuous deployment
- Click "Stop auto publishing"

---

## Monitoring & Logs

### View Function Logs
1. Go to Netlify dashboard
2. Click on your site
3. Go to "Functions" tab
4. Click on any function to see logs

### View Build Logs
1. Go to "Deploys" tab
2. Click on any deploy
3. View the build log

---

## Cost & Limits

### Netlify Free Tier Includes:
- ✅ 125,000 function requests/month
- ✅ 100GB bandwidth
- ✅ 300 build minutes/month
- ✅ Automatic HTTPS
- ✅ Continuous deployment

### Function Limits:
- Max execution time: 10 seconds (26 seconds for background functions)
- Max payload size: 6MB
- Memory: 1024MB

For most personal finance tracking usage, the free tier is more than sufficient!

---

## Next Steps

1. ✅ Deploy to Netlify
2. ✅ Test all functionality
3. 🎉 Share your deployed app!

**Your app will be live at**: `https://your-site-name.netlify.app`

You can customize the domain in: Site settings → Domain management
