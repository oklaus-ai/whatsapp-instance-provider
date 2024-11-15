# Use the official Node.js image as the base
FROM node

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json for better caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the container
COPY . .

# Set environment variables
ENV AUTO_UPDATE=true
ENV PORT=3333

# Expose the port the app runs on
EXPOSE $PORT

# Command to run the app, including optional auto-update
CMD npm start
