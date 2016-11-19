import DmxParam from './DmxParam.js';
import {clampedRangeMapper} from '../util/range-mapper.js';

const rxFunction = /(\w+)\s*(?:\((\d*(?:\.\d+)?)(\w*)\))?/;

/**
 * A parameter with multiple functions. Values are generally strings that
 * are interpreted as functions. So for a definition like
 *
 * shutter = MultiRangeParam(10, {
 *   closed: {range: [0,6]},
 *   open: {range: [7,13]},
 *   strobe: {range: [14,100], values: [0, 1]}
 * })
 *
 * all of these values are valid:
 *
 * shutter: open; // not a function-call, sets start of the range
 * shutter: closed(); // same as above
 * shutter: strobe(0.4); // will set the corresponding mapped value
 * shutter: strobe; // no value: is assumed to be zero (or the lowest of min
 * and max if zero isn't within)
 */
export default class MultiRangeParam extends DmxParam {
  constructor(channel, rangeDefinitions) {
    super([channel]);

    this.dmxToValueCache = [];
    this.mapping = {};

    // setup this.mapping
    Object.keys(rangeDefinitions).forEach(key => {
      const rangeDefinition = rangeDefinitions[key];

      if (!rangeDefinition.range) {
        throw new Error('invalid definition for range "' + key + '". ' +
          'Parameter range is missing.');
      }

      const [rangeStart, rangeEnd] = rangeDefinition.range;
      const [valueStart = 0, valueEnd = 1] = rangeDefinition.values || [];

      this.mapping[key] = Object.assign({}, rangeDefinition, {
        key,
        toDmx: clampedRangeMapper(valueStart, valueEnd, rangeStart, rangeEnd),
        toValue: clampedRangeMapper(rangeStart, rangeEnd, valueStart, valueEnd)
      });
    });
  }

  getValue(device) {
    const dmxToValue = (dmxValue, definition) => {
      const value = definition.toValue(dmxValue);
      if (definition.key === 'default') {
        return value;
      }

      return definition.values ?
        definition.key + '(' + value + ')' : definition.key;
    };

    const dmxValue = device.getChannelValue(this.channels[0]);
    if (!this.dmxToValueCache[dmxValue]) {
      const definition = this._getRangeDefinitionForValue(dmxValue);

      this.dmxToValueCache[dmxValue] = dmxToValue(dmxValue, definition);
    }

    return this.dmxToValueCache[dmxValue];
  }

  setValue(device, value) {
    if (this.mapping.default && isFinite(value)) {
      device.setChannelValue(this.channels[0],
          Math.round(this.mapping.default.toDmx(value)));

      return;
    }

    const [, name, argument = 0] = value.match(rxFunction);

    device.setChannelValue(this.channels[0],
        Math.round(this.mapping[name].toDmx(argument)));
  }

  _getRangeDefinitionForValue(value) {
    const keys = Object.keys(this.mapping);
    for (let key of keys) {
      const {range} = this.mapping[key];
      if (range[0] > value || range[1] < value) {
        continue;
      }

      return this.mapping[key];
    }

    return null;
  }
}
