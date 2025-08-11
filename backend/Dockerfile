FROM node:18-alpine

LABEL maintainer="Aeon Analytics Team"
LABEL version="1.0"
LABEL description="Aeon Analytics Backend Service"

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm install --save-dev nodemon ts-node typescript

COPY . .

COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

RUN rm -rf dist && npm run build
RUN ls -l dist

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["/wait-for-it.sh", "postgres", "5432", "node", "dist/index.js"] 
