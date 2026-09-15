FROM node:20-alpine                                        
                                                               
    WORKDIR /app                                               
                                                               
    RUN apk add --no-cache openssl libc6-compat                
  
    COPY package.json package-lock.json* ./
    COPY prisma ./prisma/
    RUN npm install
  
    COPY . .
  
    RUN npm run build
  
    RUN mkdir -p /app/data
  
    ENV NODE_ENV=production
    EXPOSE 3000
  
    CMD ["npm", "run", "docker:start"]
