import assign from 'lodash.assign';

import device from './device';
import param from './param';
import DmxDevice from './device/DmxDevice';
import DeviceGroup from './device/DeviceGroup';
import DmxOutput from './transport/DmxOutput';

/**
 * @typedef {Object} DmxDriver
 * @property {function(Buffer):void} send Sends a dmx-buffer.
 */

/**
 * Initalizes the DmxOutput with the given driver.
 *
 * @param {DmxDriver} driver The DMX-Driver implementation.
 * @returns {DmxOutput} The initialized output
 */
function init(driver) {
  let output = new DmxOutput(driver);

  return output;
}

assign(init, {
  DmxOutput, DmxDevice, DeviceGroup, param
});

export default init;
