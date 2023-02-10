# Use a Node.js base image
FROM node:14

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json files to the container
COPY package*.json ./

# Download and install the project dependencies
RUN npm ci

# Copy the rest of the project files to the container
COPY . .

# Build the Next.js project
RUN npm run build

# Set the environment variable to production
ENV NODE_ENV=production

# Expose the default Next.js port
EXPOSE 3000

# Start the Next.js server
CMD [ "npm", "start" ]
