[![Moleculer](https://badgen.net/badge/Powered%20by/Moleculer/0e83cd)](https://moleculer.services)

# Introduction
This is a [Moleculer](https://moleculer.services/)-based microservices project. Generated with the [Moleculer CLI](https://moleculer.services/docs/0.14/moleculer-cli.html).

## Getting Started
1. install server nats (https://docs.nats.io/running-a-nats-service/introduction/installation)
2. run `npm install`
3. Setup link mongodb DB_GENERIC_MONGO_URI in file .env.xxx

## Start Project
Start the project with `npm run dev` command. 
- open the http://localhost:3000/ URL in your browser. 
- Link open swagger: http://localhost:3000/openapi

NPM scripts

- `npm run dev`: Start development mode (load all services locally with hot-reload & REPL)
- `npm run start`: Start production mode (set `SERVICES` env variable to load certain services)
- `npm run cli`: Start a CLI and connect to production. Don't forget to set production namespace with `--ns` argument in script
- `npm run lint`: Run ESLint
- `npm run ci`: Run continuous test mode with watching
- `npm test`: Run tests & generate coverage report
- `npm run dc:up`: Start the stack with Docker Compose
- `npm run dc:down`: Stop the stack with Docker Compose

Usefull commands:
- List all connected nodes
`nodes`
- List all registered service actions
`actions`

## Services
- **api**: API Gateway services
- **customer**: Sample DB service

## Mixins
- **db.mixin**: Database access mixin for services. Based on [moleculer-db](https://github.com/moleculerjs/moleculer-db#readme)

## STEP CREATE ENTITY

Entities
* Create file in entities folder
* Import it into index.ts

Types
* Create file in types folder
* Import it into index.ts

Models
* Create file in models folder
* Import it into index.ts

Mixins - dbMixins
* Create file in mixins/dbMixins
* Import it into index.ts

Starting Service & API
* Create folder any file in services folder, this is write api

## Useful links

* Moleculer website: https://moleculer.services/
* Moleculer Documentation: https://moleculer.services/docs/0.14/

## TO-DO

1. - [x] Validating request params - https://github.com/icebob/fastest-validator
2. - [ ] Log system
    - [x] Default logger to file
    - [ ] Daily report to administrator (send telegram)
3. - [ ] Error code with description - Notify important bug to administrator (send telegram)
4. - [ ] Using Queue
5. - [ ] Using Docker
