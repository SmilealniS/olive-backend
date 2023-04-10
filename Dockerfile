FROM node:18-buster
WORKDIR /app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install
COPY . .
EXPOSE 4000 8000
CMD ["npm", "start"]
