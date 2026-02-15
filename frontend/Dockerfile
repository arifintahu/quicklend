FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "\
  if [ -f /artifacts/frontend.env ]; then \
    export $(cat /artifacts/frontend.env | xargs); \
  fi && \
  npm run dev"]
