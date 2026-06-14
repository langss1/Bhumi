FROM node:18-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy all source files
COPY . .

# Expose port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
