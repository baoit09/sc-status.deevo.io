# Network Status Service
# Pre-requisites
- NodeJS 8.X
  - curl -sL https://deb.nodesource.com/setup_8.x -o nodesource_setup.sh
  - nano nodesource_setup.sh
  - sudo bash nodesource_setup.sh
  - sudo apt-get install -y nodejs
- sudo apt-get install -y node-gyp
# To start app:
1. sudo apt-get install mongodb
2. sudo service mongod start
3. clone this repo from github
4. cd to sc-status.deevo.io
5. run: npm install
6. run: utils/get-remote-config.sh with appropriate parameters
7. run: npm start

If it shows up: [API Server is running at http://localhost:3000/] means that api server is started up successfuly.

Notes:
- For error `node: not found`, run: `sudo apt-get install -y nodejs-legacy`