.PHONY: help test test-grep

# Escape code
esc=`echo "\033"`

# Set colors
cc_red="${esc}[0;31m"
cc_green="${esc}[0;32m"
cc_yellow="${esc}[0;33m"
cc_blue="${esc}[0;34m"
cc_normal="${esc}[m\017"

# Determine reporter
reporter=tap
runner=tape
ifdef npm_config_testling
	runner=testling
endif
ifdef npm_config_dot
	reporter=dot
endif
ifdef npm_config_spec
	reporter=spec
endif

all: help

help:
	@echo
	@echo $(cc_blue)"To run tests:"$(cc_normal)
	@echo "  [grep=pattern] npm test [--dot | --spec] [--coverage | --testling]"
	@echo
	@echo $(cc_blue)"To run benchmarks:"$(cc_normal)
	@echo "  [grep=pattern] npm run benchmark"
	@echo

test:
	$(if $(filter testling, $(runner)), @echo "Running tests in browser via testling.",)
	$(if $(grep), @echo "Running test files that match pattern: $(grep)\n",)
	@mkdir -p coverage
	@jshint *.js example/*.js test/*.js 2>&1 | cat > coverage/linterror
	$(if $(filter-out tap, $(reporter)), @printf $(cc_red),)
	@if [ -s coverage/linterror ]; then cat coverage/linterror | sed '/^$$/d' | sed 's/\([0-9][0-9]*\) error/\1 jshint error/'; echo; exit 1; fi
	$(if $(filter-out tap, $(reporter)), @printf $(cc_normal),)
	@rm -f coverage/linterror
	$(if $(filter tap, $(reporter)), $(if $(filter testling, $(runner)), @find ./test -name "*.js" -type f -maxdepth 1 | grep ""$(grep) | xargs browserify -- | testling, @find ./test -name "*.js" -type f -maxdepth 1 | grep ""$(grep) | xargs istanbul cover --report lcovonly --print none tape --),)
	$(if $(filter dot, $(reporter)), $(if $(filter testling, $(runner)), @find ./test -name "*.js" -type f -maxdepth 1 | grep ""$(grep) | xargs browserify -- | testling | tap-dot, @find ./test -name "*.js" -type f -maxdepth 1 | grep ""$(grep) | xargs istanbul cover --report lcovonly --print none tape -- | tap-dot),)
	$(if $(filter spec, $(reporter)), $(if $(filter testling, $(runner)), @find ./test -name "*.js" -type f -maxdepth 1 | grep ""$(grep) | xargs browserify -- | testling | tap-spec, @find ./test -name "*.js" -type f -maxdepth 1 | grep ""$(grep) | xargs istanbul cover --report lcovonly --print none tape -- | tap-spec),)
ifdef npm_config_coverage
	@echo
	@istanbul report text | grep -v "Using reporter" | grep -v "Done"
endif
	@istanbul report html > /dev/null
	@rm -f coverage/error
	@istanbul check-coverage --statements 100 --branches 100 --functions 100 --lines 100 2>&1 | cat > coverage/error
	$(if $(filter-out tap, $(reporter)), @printf $(cc_red),)
	$(if $(grep),,@if [ -s coverage/error ]; then echo; grep ERROR coverage/error; echo; exit 1; fi)
	$(if $(filter-out tap, $(reporter)), @printf $(cc_normal),)

benchmark:
	@echo
	@date
	$(if $(grep), @echo "Running perf files that match pattern: $(grep)",)
	@echo "--------------------------------------------------------------"
	@PERFS=`find ./perf -name "*.js" -type f -maxdepth 1 | grep ""$(grep)`; for PERF in $$PERFS; do node $$PERF; done 
	@echo "--------------------------------------------------------------"
