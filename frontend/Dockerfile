FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=0 /app/dist ./dist
RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "5173"]
