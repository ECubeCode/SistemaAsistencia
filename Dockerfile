FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

RUN mkdir -p /app/data

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "run", "docker:start"]
