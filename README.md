# Call Mapper

A React application for generating call assignments for groups of people without reciprocals.

## Features

- Generate call assignments for any number of people
- Configurable number of calls per person (1-5)
- Mathematical validation to prevent impossible configurations
- Real-time stats and feedback
- Copy assignments as text for sharing

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## Deployment to Render.com

### Option 1: Using render.yaml (Recommended)

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Connect your repository to Render.com
3. Render will automatically detect the `render.yaml` file and deploy as a static site

### Option 2: Manual Configuration

1. Create a new Static Site on Render.com
2. Connect your Git repository
3. Configure the build settings:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
   - **Node Version**: 18.x (or latest)

## Environment Variables

No environment variables are required for this application.

## Build Output

The application builds to the `build/` directory and can be served as a static site.

## License

MIT
