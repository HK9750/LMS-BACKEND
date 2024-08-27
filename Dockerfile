# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Compile TypeScript files (if applicable)
RUN npm run build

# Expose the port that the app runs on
EXPOSE 3000

# Start the app
CMD ["npm","run" ,"start"]

