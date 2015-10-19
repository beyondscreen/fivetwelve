/**
 * @typedef {Object} DmxDriver
 * @property {function(Buffer):Promise} send sends an updated dmx-buffer
 */

/**
 * Encapsulates the main DMX-buffer to be used in the program and handles
 * sending out the data-packets at a fixed framerate.
 */
export default class DmxOutput {
  /**
   * Initialize a new output.
   *
   * @param {DmxDriver} driver The driver that will bring the
   *   DMX-Data to it's destination.
   */
  constructor(driver) {
    this.driver = driver;
    this.timer = null;

    this.dmxBuffer = new Buffer(512);
    this.dmxBuffer.fill(0);

    this.dmxFrameCallbacks = [];
  }

  /**
   * register a callback to be called before a new frame gets rendered.
   * In order to run an animation you should call this method again as the
   * first thing in the provided callback:
   *
   *     function loop(dt) {
   *       output.requestDmxFrame(loop);
   *
   *       // ... update dmx-buffer
   *     }
   *
   *     // render at 30FPS
   *     output.start(30);
   *     // kickoff animation
   *     output.requestDmxFrame(loop);
   *
   * @param {function(dt:Number)} callback A callback receiving the time since
   *   start() was called as argument.
   */
  requestDmxFrame(callback) {
    this.dmxFrameCallbacks.push(callback);
  }

  /**
   * Retrieve the DMX-Buffer.
   * @returns {Buffer} The DMX-Buffer to be used by the program.
   */
  getBuffer() {
    return this.dmxBuffer;
  }

  /**
   * Sends the Buffer to the driver. Should only be called this manually
   * when running without a frame-interval.
   */
  send() {
    this.driver.send(this.dmxBuffer);
  }

  /**
   * Starts the timer for sending data-frames.
   * @param {Number} framerate The number of frames per second with which data
   *   will be handed over to the driver.
   */
  start(framerate = 0) {
    //console.log('start', this.timer, this.framerate);
    if (this.timer || framerate <= 0) {
      return;
    }

    this.startTime = Date.now();
    this.timer = setInterval(() => {
      if (this.dmxFrameCallbacks.length > 0) {
        let dt = Date.now() - this.startTime,
          callbacks = this.dmxFrameCallbacks;

        // reset callbacks-list before calling them.
        this.dmxFrameCallbacks = [];
        callbacks.forEach(fn => fn(dt));
      }

      this.send();
    }, 1000 / framerate);
  }

  /**
   * Stops the timer for sending data-frames. Can always be started again by
   * calling start().
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = null;
  }
}
