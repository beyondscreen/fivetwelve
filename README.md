# fivetwelve – DMX512 light control library

[![Build Status](https://travis-ci.org/beyondscreen/fivetwelve.svg?branch=master)](https://travis-ci.org/beyondscreen/fivetwelve)

| **NOTE:** this documentation is work-in-progress.

The fivetwelve library provides abstractions to easily control professional light-equipment using the DMX512-protocol.


## Installation

This module can be installed from npm

    npm install --save fivetwelve

In addition to the core-library you will need to use a driver to actually send the dmx-data. Drivers are also available in npm and usually have their names prefixed with `fivetwelve-driver`. So, if you want to use ArtNet as output-interface you can use

    npm install --save fivetwelve-driver-artnet


## Usage

This module is written using ES6-Syntax and features. If you are using ES6 in your project you can simply import the module like so:

```javascript
import fivetwelve from 'fivetwelve';
import ArtNetDriver from 'fivetwelve-driver-artnet';

// ...
```

Alternatively you can use the ES5-Version by appending `/es5` to the module-names:

```javascript
var fivetwelve = require('fivetwelve/es5');
var ArtNetDriver = require('fivetwelve-driver-artnet/es5');

// ...
```

For the rest of the documentation ES6-Syntax is assumed.


### API-Overview

 * `DmxOutput`: owns the data-buffer for a single dmx-universe, manages the frame-timing for dmx-data and communication with the DMX-driver.
 * `DmxDevice`: provides a simple API to manipulate light-fixtures
 * `param.DmxParam`: the glue between logical-values used by your
     program and the corresponding DMX-values on the wire.
 * `DeviceGroup`: a collection of `DmxDevice` instances that exposes
     an interface identical to the contained devices.


### DmxOutput

The `DMXOutput` is the owner of the dmx-buffer for a dmx-universe. Every device is connected to a single output-instance. It also manages frame-timing and communication with the actual DMX-interface.

When creating an output-instance you need to specify a driver to use. As receiving dmx-data isn't implemented yet, the driver is really just an object that implements a send-method.

The main function of the fivetwelve-library will just call the constructor of the DmxOutput.

```javascript
import fivetwelve from 'fivetwelve';

// create a dummy-driver that doesn't do anything
const driver = {
  send(dmxBuffer) { return Promise.resolve(); }
}

// create an output using the specified driver
const output = fivetwelve(driver);

// start the output at 30 frames/second.
output.start(30);
```

This way, the output will handle the timing automatically and you can just modify the buffer using the devices attached to the output and the changes will be sent automatically with the next frame.

Alternatively you can decide to handle the timing yourself. In this case you need to call `output.send()` to send the current dmx-buffer to the driver.


### DmxDevice

A DmxDevice represents a single lighting fixture in your setup. Devices are defined by specifying a device-address and a list of parameters. For example, a simple lamp that supports RGB color-mixing and brightness-control might be defined like this:

```javascript
import fivetwelve from 'fivetwelve';

const output = fivetwelve(…);

// start the output with 30FPS
output.start(30);

const device = new fivetwelve.DmxDevice(1, {
    brightness: new fivetwelve.param.RangeParam(1),
    color: new fivetwelve.param.RgbParam([2,3,4])
});

// connect the device to the dmx-output
device.setOutput(output);

// set some values
device.brightness = 1;
device.color = '#ffaa00';
```

In this case we define a device at address 1 with two parameters using four dmx-channels: channel 1 is used to control the brightness (dimmer) and channels 2 through 4 control red, green and blue values.

All DMX channel-numbers and adresses are 1-based, so channel 1 of a device with address 1 will set the first overall channel of the DMX-universe. This was chosen to reflect how you'll see it in all manuals and settings of real-world devices.


### Parameters

The parameters are the backbone of the whole library, although they are intended to remain invisible most of the time. They convert values between the DMX-format and a logical format to be used by your programs.

Parameters are exposed by the device using "magic"-properties with custom getters and setters. So you can just set Object-properties and don't need to care about anything happening behind the scenes. So, a simple moving-head spotlight can be defined like this:

```javascript
import {DmxDevice, param} from 'fivetwelve';

let device = new fivetwelve.DmxDevice(1, {
  // a typical moving-head has a pan-range of 540° and tilt-range
  // of around 240° with 16-bit resolution. The 16 bits are spread
  // across 2 dmx-channels (in this case channels 3/4 and 5/6).
  pan: new param.HiResParam([3, 4], {min: -270, max: 270}),
  tilt: new param.HiResParam([5, 6], {min: -120, max: 120}),

  // the dimmer uses single dmx-channel and is mapped to a range
  // from 0 to 1, which is the default.
  brightness: new param.RangeParam(2),

  // the shutter can only have two states, 'open' and 'closed'.
  // Each of these states is mapped to a range of dmx-values (this
  // is something very common with dmx-devices as these are
  // sometimes still controlled by simple faders with limited
  // precision).
  shutter: new param.MappedParam(1, { open: [9, 16], closed: [0, 8]}),

  // finally there is a CMY color-mixing unit controlled via three
  // channels.
  color: new param.RgbParam([7, 8, 9], Color.CMY)
});


// setting a basic light-scene:
device.brightness = 1; // full brightness
device.shutter = 'open'; // open the shutter
device.pan = 0; // pan: center-position
device.tilt = 45; // tilt by 45°
device.color = '#ff0000'; // red color
```


