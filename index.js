const http = require('http');

module.exports = function (app) {
  var plugin = {};

  plugin.id = 'raspberry-pi-sailor-hat';
  plugin.name = 'Raspberry Pi Sailor Hat';
  plugin.description = 'Provides data from the Sailor Hat for the Raspberry Pi.';
  let interval;

  function getSailorHatValues() {
    http.request({ socketPath: "/var/run/shrpid.sock", path: "/values" },
      function (res) {
        res.on('data', function (data) {
          let {
            V_in, V_supercap, I_in, T_mcu
          } = JSON.parse(data);

          if (typeof (V_in) === "number" && typeof (V_supercap) === "number" && typeof (I_in) === "number" && typeof (T_mcu) === "number") {
            app.handleMessage(plugin.id, {
              updates: [
                {
                  values: [
                    {
                      path: "electrical.sailorHat.voltage",
                      value: V_in,
                    },
                    {
                      path: "electrical.sailorHat.supercapVoltage",
                      value: V_supercap
                    },
                    {
                      path: "electrical.sailorHat.current",
                      value: I_in
                    },
                    {
                      path: "electrical.sailorHat.power",
                      value: I_in * V_in
                    },
                    {
                      path: "environment.sailorHat.temperature",
                      value: T_mcu
                    }
                  ]
                }
              ]
            });
          }
        });
        res.on('error', function (err) {
          app.setPluginStatus('Error while reading from socket: ' + err.message);
          app.debug(err.message);
        })
      }).end();
  };

  plugin.start = function (options, restartPlugin) {
    interval = setInterval(function () {
      getSailorHatValues();
    }, 10000);
    app.setPluginStatus('Started');
    app.debug('Plugin started');
  };

  plugin.stop = function () {
    if (interval) {
      clearInterval(interval);
    }
    app.setPluginStatus('Stopped');
    app.debug('Plugin stopped');
  };

  plugin.schema = {
  };

  return plugin;
};