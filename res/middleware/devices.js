<script type="text/javascript">
(function() {
    var phonegap = phonegap || {};

    phonegap.getSelectedDevice = function() {
      var devicesEm = document.getElementById("phonegap_devices");
      if(devicesEm) {
        return devicesEm.options[devicesEm.selectedIndex].value;
      };
      return null;
    };


    var url = 'http://' + document.location.host + '/__api__/devices';

    function updateDeviceList(devices) {
        if(devices.length > 0) {
          phonegap.devices = devices;
          var devicesEm = document.createElement("select");
          devicesEm.style.position = "absolute";
          devicesEm.style.top = "0px";
          devicesEm.style.right = "0px";
          devicesEm.id = "phonegap_devices";
          for(var i = 0 , j = devices.length ; i < j ; i++) {
            var deviceEm = document.createElement("option");
            deviceEm.text = devices[i].device.platform + " " + devices[i].device.version;
            deviceEm.value = devices[i].ipaddress;
            deviceEm.style["background-color"] = "green";
            devicesEm.add(deviceEm);
          }
          var exDevicesEm = document.getElementById("phonegap_devices");
          if(exDevicesEm) {
            var exDevicesParentEm = exDevicesEm.parentNode;
            exDevicesParentEm.replaceChild(devicesEm, exDevicesEm);
          } else {
            document.body.appendChild(devicesEm);
          }
        }
    }

    function checkForDevices() {
        var xhr = new XMLHttpRequest();
        xhr.open('get', url, true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.onreadystatechange = function() {
            if (this.readyState === XMLHttpRequest.DONE && this.status === 200 && this.responseText) {
                var response = JSON.parse(this.responseText);
                if (response.devices) {
                  updateDeviceList(response.devices);
                }
            }
        }
        xhr.send();
    }
    
    (function overrideBrowserExec() {

      cordova.define.remove("cordova/exec");
    
      cordova.define("cordova/exec", function(require, exports, module) {
        var cordova = require('cordova');
        var execProxy = require('cordova/exec/proxy');

        module.exports = function(success, fail, service, action, args) {

            var proxy = execProxy.get(service, action);

            if (proxy) {
                var callbackId = service + cordova.callbackId++;

                if (typeof success == "function" || typeof fail == "function") {
                    cordova.callbacks[callbackId] = {success:success, fail:fail};
                }

                try {
                    if(phonegap.getSelectedDevice() !== null) {
                      var socket = new WebSocket("ws://"+phonegap.getSelectedDevice());
                      var data = {
                        service: service,
                        action: action,
                        args: []
                      };
                      socket.onmessage = function(event) {
                        var res = JSON.parse(event.data);
                        console.log(res);
                        success(event.data);
                      };
                      socket.onopen = function(event) {
                        socket.send(JSON.stringify(data));
                      };
                    } else {
                      console.log("no FUCKING socket");
                      proxy(success, fail, args);
                    }
                }
                catch(e) {
                    // TODO throw maybe?
                    var msg = "Exception calling :: " + service + " :: " + action  + " ::exception=" + e;
                    console.log(msg);
                }
            }
            else {
                fail && fail("Missing Command Error");
            }
        };

      });
    })(window);

    setInterval(checkForDevices, 1000 * 10);

})(window);

</script>