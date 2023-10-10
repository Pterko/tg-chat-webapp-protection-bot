FROM node:20-alpine

WORKDIR /usr/app

# first copy just the package and the lock file, for caching purposes
COPY package.json ./
COPY package-lock.json ./

# install dependencies
RUN npm ci

# copy the entire project
COPY . .

# build
RUN npm run build

EXPOSE 12000
CMD [ "npm", "run", "start" ]
