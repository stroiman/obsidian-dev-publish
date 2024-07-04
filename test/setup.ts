import * as sinon from "sinon";
import * as chai from "chai";
import sinonChai from "sinon-chai";
import chaiLike from "chai-like";

// Enable the following line to enable the `.should` assertion syntax.
// chai.should();

// Doing this adds a `.should` function to `Object.prototype`, allowing a more
// fluent assertion syntax, so instead of:
// ```
//   expect(actual).to.equal(42)
// ```
// You can write
// ```
//     actual.should.equal(42)
// ```
//
// Note, if `actual` can be `null` or `undefined`, the `.should` syntax throws
// an error (which still fails the test, just with a less helpful error).
//
// If you need to verify that it IS `null` or `undefined`, use `expect`
// ```
//   expect(actual).to.be.null;
//   expect(actual).to.be.undefined;
// ```

// -- CHAI PLUGINS --
//
// Install chai plugins, here sinonChai is added to help verify code
// interacting with mocking.
// You can add more plugins, or write your own.
chai.use(sinonChai);
chai.use(chaiLike);

chai.should();

// Reset all mocking after each test.
afterEach(() => {
  sinon.reset();
});
