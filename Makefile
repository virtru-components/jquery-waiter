develop:
	@component install --dev

test: 
	@component test-build
	@karma start --single-run

interactive-test: 
	@karma start
