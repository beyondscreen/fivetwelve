import 'object-assign';

import {DmxOutput} from './transport';
import * as param from './param';

export {param};
export {DeviceGroup, DmxDevice} from './device';
export {DmxOutput} from './transport';

/**
 * @typedef {Object} DmxDriver
 * @property {function(Buffer):Promise} send Sends a dmx-buffer.
 */

/**
 * Initalizes the DmxOutput with the given driver.
 *
 * @param {DmxDriver} driver The DMX-Driver implementation.
 * @returns {DmxOutput} The initialized output
 */
export default function init(driver) {
  return new DmxOutput(driver);
}
