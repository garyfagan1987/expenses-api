PATH := node_modules/.bin:$(PATH)

clean-depend:
	rm -rf node_modules

depend:
	yarn install

mongod:
	mongod

lint:
	eslint "**/*.js" --config .eslintrc

deploy:
	project_jwtPrivateKey=mySecureKey DEBUG=app:startup nodemon app.js