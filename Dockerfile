FROM node:18

RUN mkdir -p /home/node/dist/nest-hub-d

RUN npm install -g pnpm

WORKDIR /home/node/dist/nest-hub-d

COPY package*.json ./

RUN pnpm install

ENV PORT=1488

COPY . .

RUN pnpm build

EXPOSE ${PORT}

CMD ["pnpm", "start:dev"]

