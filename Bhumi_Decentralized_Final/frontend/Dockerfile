FROM node:18-alpine

WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy all files
COPY . .

# Build the Next.js app
RUN npm run build

EXPOSE 3000

# Start the application
CMD ["npm", "start"]
