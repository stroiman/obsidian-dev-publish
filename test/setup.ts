import * as sinon from "sinon";
import * as chai from "chai";
import sinonChai from "sinon-chai";
import chaiLike from "chai-like";
import chaiAsPromised from "chai-as-promised";

chai.use(sinonChai);
chai.use(chaiLike);
chai.use(chaiAsPromised);

chai.should();

afterEach(() => {
  sinon.reset();
});
