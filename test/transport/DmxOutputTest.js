import sinon from 'sinon';
import expect from 'expect.js';

import DmxOutput from '../../lib/transport/DmxOutput';

describe('DMXOutput', () => {
  let clock, driver;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
    driver = {
      send: sinon.spy()
    };
  });

  afterEach(() => {
    clock.restore();
  });

  describe('constructor()', () => {
    it('creates a buffer to be used', () => {
      let out = new DmxOutput(driver, 50);

      var buf = out.getBuffer();
      expect(buf).to.be.a(Buffer);
      expect(buf.length).to.be(512);
      expect(Array.prototype.slice.call(buf).join('')).to.match(/^0{512}$/);
    });
  });

  describe('start() / stop()', () => {
    it('will start sending frames with the given framerate', () => {
      let out = new DmxOutput(driver);

      out.start(10);
      clock.tick(1001);
      expect(driver.send.callCount).to.be(10);

      out.stop();
      clock.tick(1001);
      expect(driver.send.callCount).to.be(10);

      out.start(20);
      clock.tick(501);
      expect(driver.send.callCount).to.be(20);

      driver.send.args.forEach(([buffer]) => {
        expect(buffer).to.be(out.getBuffer());
      });
    });

    it('will not do anything if initialized without a framerate', () => {
      let out = new DmxOutput(driver);

      out.start();
      clock.tick(1000);
      expect(driver.send.callCount).to.be(0);
    });


    it('will send a single frame when send is called', () => {
      let out = new DmxOutput(driver);

      out.start();
      clock.tick(1000);
      expect(driver.send.callCount).to.be(0);
    });
  });

  describe('requestDmxFrame()', () => {
    it('will be called before the frame gets sent', () => {
      let out = new DmxOutput(driver),
        spy = sinon.spy();

      let callback = (dt) => {
        out.requestDmxFrame(callback);
        spy(dt);
      };

      out.requestDmxFrame(callback);
      out.start(10);

      clock.tick(100);

      expect(spy.callCount).to.be(1);
      expect(spy.firstCall.args[0]).to.be(100);

      clock.tick(900);
      expect(spy.callCount).to.be(10);
      //setImmediate(done);
    });
  });
});
