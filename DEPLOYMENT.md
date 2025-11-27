# Deployment Guide

## Quick Deploy to Vercel

The easiest way to deploy this Next.js application is to use Vercel:

1. **Push code to GitHub**
   \`\`\`bash
   git add .
   git commit -m "Initial geofence system"
   git push origin main
   \`\`\`

2. **Connect to Vercel**
   - Go to https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repository
   - Click "Deploy"

3. **Access your deployment**
   - Vercel provides a live URL (e.g., `https://geofence-*.vercel.app`)
   - All APIs work automatically

## Deploy to Docker

Build and run with Docker:

\`\`\`bash
# Build the image
docker build -t geofence-system .

# Run the container
docker run -p 3000:3000 geofence-system

# Access at http://localhost:3000
\`\`\`

## Deploy to AWS EC2

\`\`\`bash
# SSH into instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Clone repo and deploy
git clone your-repo
cd geofence-event-processing
npm install
npm run build

# Use PM2 for process management
npm install -g pm2
pm2 start npm --name "geofence" -- start
pm2 startup
pm2 save
\`\`\`

## Environment Variables

For production, no environment variables are required for the MVP. Future versions will need:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `API_KEY_SECRET` - For JWT token signing

## Monitoring

- **Vercel:** Built-in monitoring at https://vercel.com/dashboard
- **Self-hosted:** Use PM2 Plus or DataDog for APM
- **Logs:** Check `/var/log/app.log` on self-hosted servers

## Scaling Considerations

- Current single-instance deployment handles ~10k events/second
- For horizontal scaling, add a database layer and message queue
- See IMPROVEMENTS.md for detailed roadmap
