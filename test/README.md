Tests are broken up into three distinct types- unit and integration, and benchmark tests.

See the README.md file in each directory for more information about the distinction and purpose of each type of test.

The following conventions are true for all three types of tests:

    Instead of partitioning tests for various components into subdirectories, the test files are located in the top level of the directory for their test type (i.e. /test/TEST_TYPE/*.test.js).
    All test filenames have the *.test.js suffix.
    Each test file for a particular component is namespaced with a prefix describing the relevant component (e.g. models.User.test.js, assets.sync_adder.test.js, etc.).

    Reasoning

    Filenames like these make it easy to differentiate tests from core files when performing a flat search on the repository (i.e. CMD/CTRL+P in Sublime). Likewise, this makes the process easier to automate-- you can quickly grab all the test files with a simple recursive find on the command-line, for instance.


We are using [MochaJS](http://mochajs.org) for unit testing. Visit the `test` folder to see more. Running the following will run Mocha with code coverage reports being generated via [Istanbul](http://gotwarlost.github.io/istanbul/).

## Local Continuous Integration (CI) Testing

The best way to test while in development is to run the following command in a terminal window.
```
npm run watch-test
```

> This will run mocha tests as a background process and will continually update as tests are changed. This command can be updated in `package.json` in the scripts section.

## Remote Continuous Integration (CI) Testing

This is the command that is used in the Makefile and that is run by Travis.

```
make test
```

# Continuous Integration (CI)

The minnow currently uses [Travis](https://travis-ci.com/) for CI. He also relys on [Coveralls.io](https://coveralls.io) for coverage reports.

## Testing Dependencies

- [Mocha](http://mochajs.org) - Testing framework
- [Chai](http://chaijs.com/guide) - Assertion libary
- [Grunt Mocha Test](https://github.com/pghalliday/grunt-mocha-test)
- [Istanbul](http://gotwarlost.github.io/istanbul/) - Code coverage reports
- [Grunt Mocha Istanbul](https://github.com/pocesar/grunt-mocha-istanbul) - Code coverage
- [Barrels](https://www.npmjs.org/package/barrels) - Model fixtures
- [Sinon Spy](http://sinonjs.org) - Standalone test spies, stubs and mocks for JavaScript.
- [Nock](https://github.com/pgte/nock) - Mocking http requests
- [Supertest](https://github.com/tj/supertest)
- [WrenchJS](https://github.com/ryanmcgrath/wrench-js) - Recursive file operations
- [FS-Extra](https://github.com/jprichardson/node-fs-extra) - Extra file system methods



# Further Reading 

1. [Sails Guide to Testing](http://sailsjs.org/#/documentation/concepts/Testing)
1. [Unit testing Sails JS: How to mock SailsJS Services in Controllers](https://blog.sergiocruz.me/unit-testing-sails-js-how-to-mock-sailsjs-services-in-controllers/)
1. [Unit testing JavaScript is easy they said. It only takes a few seconds they said.](https://blog.sergiocruz.me/unit-test-sailsjs-with-mocha-and-instanbul-for-code-coverage/)
1. [Unit test SailsJS with Mocha and generate code coverage with Istanbul](https://blog.sergiocruz.me/unit-test-sailsjs-with-mocha-and-instanbul-for-code-coverage/)
1. [3 Quick Tips for Writing Tests in Node.Js (after some rambling)](http://niallohiggins.com/2012/03/28/3-quick-tips-for-writing-tests-in-nodejs/)
1. [Asynchronous Unit Tests With Mocha, Promises, And WinJS](http://lostechies.com/derickbailey/2012/08/17/asynchronous-unit-tests-with-mocha-promises-and-winjs/)