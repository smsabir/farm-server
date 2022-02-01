# farm-server

The project is to make a backend application where client can upload and register their farms, then call api for different stats.
The main task was to parsing CSV uploaded from client side then validate it and store data in Database. Then different API endpoints with some sorting / calculation parameters.

## Requirements

To Run this app in development environment, you will only need Node.js and a node global package, NPM / Yarn, installed in your environement.
you can open your terminal and type node -v. If the version appears then congratulation! you are already ahead.
If you haven't please follow below instruction.

### Node

- #### Node installation on Windows

Visit (https://nodejs.org/) and download the installer.
Also, be sure to have `git` available in your PATH, `npm` might need it (You can find git [here](https://git-scm.com/)).

- #### Node installation on Ubuntu

  You can install nodejs and npm easily with apt install, just run the following commands.

      $ sudo apt install nodejs
      $ sudo apt install npm

### Yarn installation

After installing node, this project will need yarn too, so just run the following command.

$ npm install -g yarn

## If you already have npm then yarn is not mandatory.

So if we have the required software/packages. Then we can start cloning this project.

## Cloning the project.

    $ git clone https://github.com/smsabir/farm-server.git
    $ cd "the path where you saved it"
    $ yarn install / npm install.

    It will install all the dependencies for this app.

## Configure app

But the Database Connection is not provided here. You can ask me if you need that.

so we need to configure .env file then.

## Running the project

     $npm run start:dev (as per my package.json)
     In local machine this app will try to run in port 4000.

## Simple build for production

    $ yarn build / npm run build

## Running Server in Heroku

https://sleepy-lake-87613.herokuapp.com

## ENDPOINTS I have Built

- GET: http://localhost:4000/v1/farms/
  This is for fetching all existing Farms

- GET: http://localhost:4000/v1/farms/:id/stats
  This API return All the data stored for a specified farm by it's ID

- GET: http://localhost:4000/v1/farms/:id/stats/:sensorType/monthly
  User's can get different stats data by Sensor and ID parameter. For ex: Monthly average, median, standard deviation.

All these resturns data in JSON.

There are also other EndPoints for parsing CSV, Update data, Create new data and delete, Which are not accessible using GET.

### Major Framework and packages I have used in this project.

- ExpressJS
- Mongoose with Atlas
- Express-FileUpload
- cors
- csv parser

I have deployed this app in Heroku Cloud.

### Live Server

https://sleepy-lake-87613.herokuapp.com/
