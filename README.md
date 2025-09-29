# V-MARKET - Kenya's Digital Marketplace

## Project info

**V-Market** is a modern digital marketplace built for Kenya, connecting buyers and sellers across various categories including education, entertainment, health, jobs, transport, and more.

## How can I edit this code?

There are several ways of editing your application.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (for backend services)

## How can I deploy this project?

You can deploy this project using various hosting platforms:

### Vercel
1. Connect your GitHub repository to Vercel
2. Configure build settings (build command: `npm run build`, output directory: `dist`)
3. Deploy

### Netlify
1. Connect your GitHub repository to Netlify
2. Set build command to `npm run build` and publish directory to `dist`
3. Deploy

### Other platforms
This project can be deployed on any static hosting service that supports Node.js builds, such as GitHub Pages, Firebase Hosting, or AWS S3 with CloudFront.
