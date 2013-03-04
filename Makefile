dev:
	@bower install

test: 
	@testacular start --single-run

interactive-test: 
	@testacular start
