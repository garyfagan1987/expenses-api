PATH := node_modules/.bin:$(PATH)

clean-depend:
	rm -rf node_modules

depend:
	yarn install

mongod:
	mongod

lint:
	eslint "**/*.js" --config .eslintrc

dev:
	MONGO_DB_PATH=mongodb://localhost/expenses project_jwtPrivateKey=mySecureKey DEBUG=app:startup nodemon app.js

deploy:
	project_jwtPrivateKey=mySecureKey DEBUG=app:startup nodemon app.js