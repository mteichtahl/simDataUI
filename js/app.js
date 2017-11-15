const API_URL =
'https://3gaki15y76.execute-api.ap-southeast-2.amazonaws.com/v1/data'

const MAX_HISTORY = 20
const FREQ = 10

var interval = 1000 / FREQ
var map
var marker

var dataHistory = {
  airspeed: new CBuffer(MAX_HISTORY),
  altitude: new CBuffer(MAX_HISTORY),
  heading: new CBuffer(MAX_HISTORY),
  lat: new CBuffer(MAX_HISTORY),
  lng: new CBuffer(MAX_HISTORY),
  timestamp: undefined
}

function getData (cb) {
  $.ajax({
    url: API_URL,
    contentType: 'application/json; charset=utf-8',
    dataType: 'json',
    success: function (data) {
      var heading = parseFloat(data.Item.heading.S).toFixed(2)
      var airspeed = parseFloat(data.Item.airspeed.S).toFixed(2)
      var altitude = parseFloat(data.Item.altitude.S).toFixed(0)
      var lat = parseFloat(data.Item.lat.S)
      var lng = parseFloat(data.Item.lng.S)

      dataHistory.airspeed.push(airspeed)
      dataHistory.altitude.push(altitude)
      dataHistory.heading.push(heading)
      dataHistory.lat.push(lat)
      dataHistory.lng.push(lng)
      dataHistory.timestamp = data.Item.sts.S

      cb(data.Item)
    }
  })
}

$(document)
  .ready(function () {
    $.support.cors = true
    var map = undefined
    var renderer
    var container

    var windowHalfX = window.innerWidth / 2
    var windowHalfY = window.innerHeight / 2
    var mouseX = 0, mouseY = 0
    document.addEventListener('mousemove', onDocumentMouseMove, false)

    function onDocumentMouseMove (event) {
      mouseX = (event.clientX - windowHalfX) / 2
      mouseY = (event.clientY - windowHalfY) / 2
    }

    container = document.createElement('div')
    document.body.appendChild(container)

    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000)
    camera.position.z = 250

    var scene = new THREE.Scene()

    var ambientLight = new THREE.AmbientLight(0xcccccc, 0.4)
    scene.add(ambientLight)

    var ambientLight = new THREE.AmbientLight(0xcccccc, 0.4)
    scene.add(ambientLight)

    var pointLight = new THREE.PointLight(0xffffff, 0.8)
    camera.add(pointLight)
    scene.add(camera)

    var axisHelper = new THREE.AxesHelper(90)
    scene.add(axisHelper)

    var mtlLoader = new THREE.MTLLoader()
    mtlLoader.setPath('models/')

    mtlLoader.load('A380.mtl', function (materials) {
      console.log('material loaded')
      materials.preload()

      var objLoader = new THREE.OBJLoader()
      objLoader.setMaterials(materials)
      objLoader.setPath('models/')

      objLoader.load('A380.obj',
        function (object) {
          object.position.y = - 95
          scene.add(object)

          renderer = new THREE.WebGLRenderer()
          renderer.setPixelRatio(window.devicePixelRatio)
          renderer.setSize(window.innerWidth, window.innerHeight)
          container.appendChild(renderer.domElement)

          animate()
        },
        function (xhr) {
          console.log((xhr.loaded / xhr.total * 100) + '% loaded')
        },
        function (xhr) {
          console.error('An error happened')
        }
      )
    })

    function animate () {
      requestAnimationFrame(animate)
      render()
    }
    function render () {
      camera.position.x += (mouseX - camera.position.x) * .05
      camera.position.y += (- mouseY - camera.position.y) * .05
      camera.lookAt(scene.position)
      renderer.render(scene, camera)
    }

    map =
      new GMaps({
        el: '#locationMap',
        lat: -12.043333,
        lng: -77.028333,
        zoom: 11
      })

    // if (map)
      //   google.maps.event.addListenerOnce(
      //     map.map, 'tilesloaded',
      //     function () {
      //       // this part runs when the mapobject is created and rendered
      //       console.log('tiles loaded')
      //     })

    $('#airspeedSparkline').sparkline([], {
      type: 'line',
      width: '90%',
      height: '45px',
      fillColor: '#FFFFFF'
    })
    $('#altitudeSparkline').sparkline([], {
      type: 'line',
      height: '45px',
      width: '90%'
    })
    $('#headingSparkline').sparkline([100, 10], {
      type: 'pie',
      sliceColors: ['#FFFFFF', '#3366cc'],
      height: '45px',
      offset: 0
    })

    setInterval(function () {
      getData(function (data) {
        map.setCenter(dataHistory.lat.last(), dataHistory.lng.last(), function () {
          marker = map.createMarker({
            lat: dataHistory.lat.last(),
            lng: dataHistory.lng.last(),
            title: 'test'
          })
          map.addMarker(marker)
        })

        $('#airspeedSparkline')
          .sparkline(
            dataHistory.airspeed.toArray(), {
              type: 'line',
              width: '90%',
              height: '45px',
              fillColor: '#FFFFFF'
            })
        $('#altitudeSparkline')
          .sparkline(
            dataHistory.altitude.toArray(), {
              type: 'line',
              width: '90%',
              height: '45px',
              fillColor: '#FFFFFF'
            })

        $('#headingSparkline').sparkline([100, 10], {
          offset: parseInt(dataHistory.heading.last()) - 90,
          type: 'pie',
          sliceColors: ['#FFFFFF', '#3366cc'],
          height: '45px'
        })

        $('#headingText').text(dataHistory.heading.last())
        $('#airspeedText').text(dataHistory.airspeed.last())
        $('#altitudeText').text(dataHistory.altitude.last())
        $('#timeStamp').text(moment(dataHistory.timestamp).format('hh:mm:ss.m ddd DD/MM/YYYY'))
      })
    }, interval)
  })
