const API_URL =
    'https://7qa8ooqdp4.execute-api.ap-southeast-2.amazonaws.com/v1/data'

const MAX_HISTORY = 20

var dataHistory =
    {
      airspeed: new CBuffer(MAX_HISTORY),
      altitude: new CBuffer(MAX_HISTORY),
      heading: new CBuffer(MAX_HISTORY),
      timestamp: undefined
    }

    function getData(cb) {
      $.ajax({
        url: API_URL,
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        success: function(data) {
          var heading = parseFloat(data.Item.heading.S).toFixed(2);
          var airspeed = parseFloat(data.Item.airspeed.S).toFixed(2);
          var altitude = parseFloat(data.Item.altitude.S).toFixed(0);

          dataHistory.airspeed.push(airspeed)
          dataHistory.altitude.push(altitude)
          dataHistory.heading.push(heading)
          dataHistory.timestamp = data.Item.sts.S
          cb(data.Item)
        }
      })
    }

    function updateHistroy(name, data) {
      var length = dataHistory.name.length

    }

    $(document)
        .ready(function() {
          $.support.cors = true;
          var map = undefined



          var map =
              new GMaps({el: '#locationMap', lat: -12.043333, lng: -77.028333});

          if (map) {
            google.maps.event.addListenerOnce(
                map.map, 'tilesloaded', function() {
                  // this part runs when the mapobject is created and rendered
                  console.log('tiles loaded');
                });

            $('#airspeedSparkline').sparkline([], {type: 'line', width: '90%', height:'45px',fillColor:'#FFFFFF'});
            $('#altitudeSparkline').sparkline([], {type: 'line', height:'45px',width: '90%'});
            $('#headingSparkline').sparkline([100, 10], {
              type: 'pie',
               sliceColors: [ '#FFFFFF','#3366cc'],
                 height: '45px',
                 offset: 0

            });

            setInterval(function() {
              getData(function(data) {


                $('#airspeedSparkline')
                    .sparkline(
                        dataHistory.airspeed.toArray(),
                        {type: 'line', width: '90%',height:'45px',fillColor:'#FFFFFF'});
                $('#altitudeSparkline')
                    .sparkline(
                        dataHistory.altitude.toArray(),
                        {type: 'line', width: '90%',height:'45px',fillColor:'#FFFFFF'});

                $('#headingSparkline').sparkline([100, 10], {
                  offset: parseInt(dataHistory.heading.last()) - 90,
                  type: 'pie',
                  sliceColors: [ '#FFFFFF','#3366cc'],
                  height: '45px'
                });



                $('#headingText').text(dataHistory.heading.last())
                $('#airspeedText').text(dataHistory.airspeed.last())
                $('#altitudeText').text(dataHistory.altitude.last())
                $('#timeStamp').text(moment(dataHistory.timestamp).format('hh:mm:ss.m ddd DD/MM/YYYY'))
                
              })
            }, 500)
          }

        });