dev:
	@bower install
	@npm install .

test: 
	@testacular start --single-run
