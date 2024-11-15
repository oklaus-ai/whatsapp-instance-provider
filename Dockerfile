# Use the official Node.js image as the base
FROM node

# Set the working directory
WORKDIR /app

# Install FFmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install Node.js dependencies
RUN npm install

# Copy the entire application code
COPY . .

# Expose the application port
ENV PORT=3333
EXPOSE $PORT

# Start the application
CMD ["npm", "start"]
