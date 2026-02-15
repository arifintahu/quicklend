FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001

CMD ["sh", "-c", "\
  if [ -f /artifacts/backend.env ]; then \
    set -a && . /artifacts/backend.env && set +a; \
  fi && \
  npx drizzle-kit migrate && \
  npx tsx src/index.ts"]
