# Local Development Setup

> Quick guide to set up your local development environment.

## Prerequisites

**Node.js Version:**

```bash
node --version
# Required: 20.19.0+ or 22.x LTS
```

If outdated, download from [nodejs.org](https://nodejs.org/)

## Tools Used

- **IDE:** [Trae AI](https://www.trae.ai/) - AI-assisted development
- **CLI:** Netlify CLI - Local development server
- **Platform:** Netlify - Shared team account

## Setup Steps

### 1. Install Netlify CLI

```bash
npm install -g netlify-cli
```

### 2. Authenticate

```bash
netlify login
```

Browser will open → Login with shared account credentials

### 3. Link Project

```bash
netlify link
```

Choose an option: "Use current git remote" or "search by site name"

### 4. Install Corepack

```bash
npm install -g corepack
```

Choose an option: "Use current git remote" or "search by site name"

### 5. Install required packages

```bash
yarn install
```

### 6. Start local server

```bash
netlify dev
```

Opens at: `http://localhost:8888` or the URL displayed in your terminal

## What `netlify dev` Does

- Starts local development server
- Simulates Netlify environment
- Injects environment variables
- Enables serverless functions

## 📱 Mobile Testing & Network Access

### Access from Other Devices

Once the Netlify Dev server is running, it's accessible from other devices on the same WiFi network.

### Setup for Mobile Testing

1. **Start server with network access:**
   ```bash
   netlify dev --host 0.0.0.0
   # or with custom port
   netlify dev --port 8789 --host 0.0.0.0
   ```

2. **Find your local IP address:**
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux  
   ifconfig
   ```

3. **Access from mobile device:**
   - Connect mobile device to the same WiFi network
   - Open browser on mobile
   - Navigate to: `http://YOUR_IP:8888`
   - Example: `http://192.168.1.100:8888`

### Use Cases

- ✅ **Mobile Testing:** Test your app directly on smartphones/tablets
- ✅ **Cross-Device Testing:** Verify compatibility across different devices
- ✅ **Team Demos:** Show work in progress to team members
- ✅ **Responsive Debugging:** Check behavior on real screen sizes

### Important Notes

- 🔒 Ensure your firewall allows connections on the used port
- 📡 All devices must be on the **same WiFi network**
- 🚀 Alternative: Use `netlify dev --live` for public tunnel access

## Quick Commands

```bash
netlify dev              # Start local server
netlify dev --port xxxx  # Start local server with a specific port
netlify dev --host 0.0.0.0  # Allow network access for mobile testing
netlify dev --live       # Create public tunnel for external access
netlify status           # Check connection
netlify open             # Open site in browser
netlify env:list         # Show environment variables
```

---

Visit [this page](https://docs.netlify.com/api-and-cli-guides/cli-guides/local-development/) for more informations about Netlify local developement

## Troubleshooting

- **Port Conflicts:** Use `netlify dev --port xxxx` to specify a different port
- **Auth Problems:** Double-check Netlify login credentials
- **Corepack Error:** Run `corepack enable` if you encounter issues
- **Environment Variables Error:** Check if it's linked to a Netlify project and that the netlify project contain the required environement variables

```bash
netlify status # Check if it's linked to a Netlify project
netlify env:list # Show environment variables
netlify link # Link project to Netlify
```

- **crypto.hash Error:** Verify if you are using the required node version

  ```bash
  node --version
  # Required: 20.19.0+ or 22.x LTS
  ```

- **Supabase Not Connected Error:** If the app shows "Supabase not connected":
  - Verify environment variables are properly loaded:
    ```bash
    netlify env:list
    ```
  - Ensure you're linked to the correct project:
    ```bash
    netlify link
    ```
    Select from "recent projects" to choose the right one

- **Mobile Access Issues:** 
  - Verify both devices are on same WiFi network
  - Check firewall settings allow incoming connections
  - Try `netlify dev --live` for alternative access method