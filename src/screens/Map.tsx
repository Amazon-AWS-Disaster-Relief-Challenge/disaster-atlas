import { 
  useState, 
  useEffect, 
  useRef
} from "react";
import { 
  StyleSheet, 
  View, 
  Dimensions, 
  Platform, 
  Text, 
  AppState, 
  AppStateStatus, 
  ImageBackground,
} from "react-native";
import MapView, { 
  PROVIDER_GOOGLE, 
  Marker, 
  MapTypes, 
  Camera,
  LatLng,
  Circle,
  Geojson
} from "react-native-maps";
import MapViewDirections, { MapViewDirectionsWaypoints } from 'react-native-maps-directions';
import { 
  requestForegroundPermissionsAsync, 
  getCurrentPositionAsync, 
  watchPositionAsync, 
  LocationAccuracy, 
  LocationSubscription, 
  PermissionStatus,
} from "expo-location";
import Slider from "@react-native-community/slider";

import { GOOGLE_MAP_STYLE } from "../components/DisasterMap/MapStyle"; 
import { AppMode, DisasterCard, Location } from "../commons/UserMap";
import { DisasterCardDetail } from "../components/DisasterMap/DisasterCardDetail";
import { MapSearchBar } from "../components/DisasterMap/MapSearchBar";
import { 
  AssemblyPointMarker, 
  AddAssemblyPointMarker, 
  CurrentLocationBtn, 
  MapTypeBtn, 
  Message, 
  ViewIn3DBtn, 
  DirectionBtn,
  AddWaypointMarker,
  AnalyzeMapBtn,
} from "../components/DisasterMap/MapUtils";
import { fetchDisasters, fetchSafeWaypoints, fetchOverlayPaths } from "../API/Disaster";

const config = require('../../app.json'); 

export default function Map() {
  return (
    <View style={styles.container}>
      {
        Platform.OS !== "web" && <NativeMapView />
      }
    </View>
  );
};

const NativeMapView = () => {
  // Constants
  const DISASTER_ICON_SIZE = 25;
  const { width, height } = Dimensions.get('window');
  const ASPECT_RATIO = width / height;
  const LATITUDE_DELTA = 0.003;  
  const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
  const DEFAULT_ZOOM_LEVEL = 10;
  const MIN_ZOOM_LEVEL = 0;
  const MAX_ZOOM_LEVEL = 19;
  const mapTypes = ["standard" ,"satellite", "terrain"];
  let GOOGLE_MAP_KEY = "";

  // PS: KEEP THIS AS "true" IN ORDER TO AVOID UNINTENDED CALLS TO API
  // GOOGLE PRICING AND BILLING STATES THAT THIS API IS PAY-PER-REQUEST
  // DON'T WANT THE BILL TO BLOW UP...
  // PLEASE ENABLE THIS ONLY WHEN TESTING THE FEATURE.
  let LOCK_DIRECTIONS_API = true;
  
  if (Platform.OS == 'ios') {
    GOOGLE_MAP_KEY = config.expo.ios.config.googleMapsApiKey;
    LOCK_DIRECTIONS_API = config.expo.ios.config.lockDirectionsAPI;
  } else if (Platform.OS == 'android') {
    GOOGLE_MAP_KEY = config.expo.android.config.googleMaps.apiKey;
    LOCK_DIRECTIONS_API = config.expo.android.config.lockDirectionsAPI;
  } else {
    // TODO: web api path/key here
  }

  // react useState hooks
  const [latDelta] = useState(LATITUDE_DELTA);
  const [lngDelta] = useState(LONGITUDE_DELTA);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM_LEVEL);
  const [disasterCards, setDisasterCards] = useState([] as DisasterCard[]);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [selectedDisasterCard, setSelectedDisasterCard] = useState({} as DisasterCard);
  const [mapType, setMapType] = useState(mapTypes[0] as MapTypes);
  const [mapTypeIndex, setMapTypeIndex] = useState(1);
  const [show3D, setShow3D] = useState(true);
  const [assembleMarkers, setAssembleMarkers] = useState([] as string[]);
  const [destination, setDestination] = useState({} as Location);
  const [showPath, setShowPath] = useState(false);
  const [waypoints, setWaypoints] = useState([] as MapViewDirectionsWaypoints[]);
  const [overlayPaths, setOverlayPaths] = useState([] as any[]);
  
  // App states
  const appState = useRef(AppState.currentState);

  // User Location updates
  const DISTANCE_INTERVAL = 5;
  const [latLng, setLatLng] = useState({} as Location);
  const mapRef = useRef({} as MapView);
  const disasterCirleRef = useRef([] as any[]);

  const isAppForeground = (nextAppState: AppStateStatus) => {
    return appState.current.match(/inactive|background/) && nextAppState === AppMode.ACTIVE;
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    appState.current = nextAppState;
  };

  const setLocationAndAnimate = (location: Location) => {
    if (!location) {
      return;
    }
    setLatLng(location);
  };

  const moveMapToCoordinate = (jumpLatLng?: Location) => {
    if (mapRef && mapRef.current) {
      const _latLng: Location = jumpLatLng ?? (Object.keys(selectedDisasterCard).length > 0 ? selectedDisasterCard.latLng : latLng);
      //@ts-ignore
      mapRef.current.animateToRegion({
        latitude: _latLng.latitude,
        longitude: _latLng.longitude,
        latitudeDelta: latDelta + zoom,
        longitudeDelta: lngDelta + zoom
      });
    }
  };

  const toggleTo3D = async () => {
    if (mapRef && mapRef.current) {
      const _latLng: Location = Object.keys(selectedDisasterCard).length > 0 ? selectedDisasterCard.latLng : latLng;
      //@ts-ignore
      const camera: Camera = await mapRef.current.getCamera();
      if (show3D) {
        camera.heading = -35;
        camera.pitch = 90;
        camera.zoom = 17;
      } else {
        camera.heading = 0;
        camera.pitch = 0;
        camera.zoom = zoom;
      }

      camera.center.latitude = _latLng.latitude;
      camera.center.longitude = _latLng.longitude;
      mapRef.current.animateCamera(camera, { duration: 2000 });
    }
  };

  const toggleMapType = () => {
    if (mapTypeIndex == mapTypes.length - 1) {
      setMapTypeIndex(0);
    } else {
      setMapTypeIndex(mapTypeIndex + 1);
    }

    setTimeout(() => {
      setMapType(mapTypes[mapTypeIndex] as MapTypes);
    }, 200);
  };

  const createSafeWaypoint = () => {
    setTimeout(() => {
      fetchSafeWaypoints()
      .then(safewaypoints => {
        setWaypoints(safewaypoints);
      })
      .catch(error => console.log(`safewaypoints fetch error - ${error}`));
    }, 1000);
  };

  const createOverlayPaths = () => {
    setTimeout(() => {
      fetchOverlayPaths(47.60396, -122.1318)
      .then(overlayPaths => {
        setOverlayPaths(overlayPaths);
      })
      .catch(error => console.log(`overlayPaths fetch error - ${error}`));
    }, 1000);
  };

  useEffect(() => {
    // register app state change
    AppState.addEventListener('change', handleAppStateChange);

    let locationSubscription: LocationSubscription;
    
    const watchCurrentPosition = async () => {
      // Get user's current location
      const { coords } = await getCurrentPositionAsync({});
      setLocationAndAnimate({ longitude: +coords.longitude, latitude: +coords.latitude } as Location);
      // Foreground mode updates
      locationSubscription = await watchPositionAsync({ accuracy: LocationAccuracy.Highest, distanceInterval: DISTANCE_INTERVAL }, locationData => {
        isAppForeground(appState.current) && setLocationAndAnimate({ longitude: +locationData.coords.longitude, latitude: +locationData.coords.latitude } as Location);
      });
    };

    const beginUserTasks = async () => {};

    const init = async () => {
      try {
        // Ask Permissions
        const fgLocationPermissionResponse = await requestForegroundPermissionsAsync();
        if (fgLocationPermissionResponse.status == PermissionStatus.GRANTED) {
          setHasPermissions(true);
          watchCurrentPosition();
          if (latLng.latitude) {
            beginUserTasks();
          }
          Promise.resolve(fetchDisasters())
          .then((disasterList: DisasterCard[]) => setDisasterCards(disasterList))
          .catch(error => console.log(`Could not fetch disaster list: ${error}`));
        } else {
          setHasPermissions(false);
        }
      } catch(error) {
        console.log(error);
      }  
    };

    init();

    return () => {
      AppState.removeEventListener('change', handleAppStateChange);
      locationSubscription && locationSubscription.remove();
    };
  }, []);

  if (!hasPermissions) {
    return (
      <Message msg={'Foreground / Background Permissions not granted'} />
    );
  }

  if (!latLng.latitude) {
    return (
      <Message msg={'Loading map view...'}/>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
        <MapView
          ref={ref => {
            //@ts-ignore
            mapRef.current = ref;
          }}
          onMapReady={() => {
            setTimeout(() => {
              // Draw geo fence around disasters
              disasterCirleRef.current.forEach(ref => {
                ref.setNativeProps({
                  fillColor: 'rgba(255, 153, 0, 0.4)',
                  strokeColor: 'rgba(255, 153, 0, 0.4)'
                });
              });
            }, 1000);
          }}
          onUserLocationChange={() => {}}
          mapType={mapType}
          style={styles.map} 
          provider={PROVIDER_GOOGLE} 
          initialRegion={{
            latitude: latLng.latitude,
            longitude: latLng.longitude,
            latitudeDelta: latDelta + zoom,
            longitudeDelta: lngDelta + zoom,
          }}
          showsUserLocation={true}
          followsUserLocation={true}
          showsMyLocationButton={false}
          zoomTapEnabled={true}
          zoomEnabled={true}
          zoomControlEnabled={true}
          showsPointsOfInterest={true}
          showsCompass={true}
          showsScale={true}
          showsBuildings={false}
          showsTraffic={false}
          showsIndoors={false}
          showsIndoorLevelPicker={false}
          customMapStyle={GOOGLE_MAP_STYLE}
        >
          {
            disasterCards && disasterCards.length > 0 &&
            disasterCards.map((disasterCard, key) => (
              <Marker 
                key={`disaster-marker-${key}`} 
                coordinate={{ latitude: disasterCard.latLng.latitude, longitude: disasterCard.latLng.longitude }}
                onPress={() => {
                  setSelectedDisasterCard(disasterCard);
                  moveMapToCoordinate();
                }}
              >
                <ImageBackground source={disasterCard.assetUrl} style={{ width: DISASTER_ICON_SIZE, height: DISASTER_ICON_SIZE }}>
                    <Text style={{ width: 0, height: 0 }}>{Math.random()}</Text>
                </ImageBackground>
              </Marker>
            ))
          }
          {
            disasterCards && disasterCards.length > 0 &&
            disasterCards.map((disasterCard, key) => (
              <Circle
                //@ts-ignore
                ref={ref => (disasterCirleRef.current[key] = ref)}
                key={`disaster-radius-${key}`}
                center={disasterCard.latLng as LatLng}
                radius={1000}
                strokeWidth={5}
                zIndex={5}
              />
            ))
          }
          { 
            assembleMarkers && assembleMarkers.length > 0 && 
            assembleMarkers.map((uuid, key) => 
              <AssemblyPointMarker 
                key={key} 
                uuid={uuid} 
                location={latLng} 
                setDestination={_latLng => setDestination(_latLng)} 
              />
            ) 
          }
          {
            Object.keys(destination).length > 0 && 
            showPath &&
            LOCK_DIRECTIONS_API == false &&
            <MapViewDirections
              origin={latLng}
              destination={destination}
              splitWaypoints={true}
              waypoints={waypoints.length > 0 ? waypoints : []}
              apikey={GOOGLE_MAP_KEY}
              strokeWidth={4}
              strokeColor="#ff66cc"
            />
          }
          {
            overlayPaths.length > 0 &&
            <Geojson 
              key={99}
              zIndex={10}
              strokeColor="red"
              fillColor="green"
              strokeWidth={2}
              geojson={{
                "type": "FeatureCollection",
                "features": [
                  {
                    "type": "Feature",
                    "geometry": {
                      "type": "MultiLineString",
                      "coordinates": overlayPaths
                    },
                    "properties": {}
                  }
                ]
              }}
            />
          }
        </MapView>
        {
          Object.keys(selectedDisasterCard).length > 0 && 
          <DisasterCardDetail toastData={selectedDisasterCard} />
        }
        <Slider
          style={styles.zoomLevelSlider}
          vertical={true}
          step={1}
          value={DEFAULT_ZOOM_LEVEL}
          minimumValue={MIN_ZOOM_LEVEL}
          maximumValue={MAX_ZOOM_LEVEL}
          minimumTrackTintColor="#FFFFFF"
          maximumTrackTintColor="#FFFFFF"
          onValueChange={value => {
            setZoom(value);
            moveMapToCoordinate();
            createOverlayPaths();
          }}
        />
        <MapSearchBar 
          data={disasterCards} 
          navigateOnMap={(_latLng: Location) => moveMapToCoordinate(_latLng)} 
          setSelectedDisasterCard={(d: DisasterCard) => setSelectedDisasterCard(d)} 
        />
        {
          Object.keys(destination).length > 0 && 
          LOCK_DIRECTIONS_API == false &&
          <DirectionBtn toggleHandler={() => setShowPath(!showPath)} />
        }
        <MapTypeBtn toggleHandler={() => toggleMapType()} />
        <ViewIn3DBtn 
          toggleHandler={() => {
            setShow3D(!show3D); 
            toggleTo3D();
          }} 
        />
        <CurrentLocationBtn 
          moveToMyLocation={() => { 
            moveMapToCoordinate();
            setSelectedDisasterCard({} as DisasterCard);
          }} 
        />
        <AddAssemblyPointMarker 
          clickHandler={() => {
            setAssembleMarkers([...assembleMarkers, (new Date()).getTime().toString()]);
          }} 
        />
        {
          Object.keys(destination).length > 0 && 
          LOCK_DIRECTIONS_API == false &&
          <AddWaypointMarker
            clickHandler={() => createSafeWaypoint()} 
          />
        }
        {
          <AnalyzeMapBtn 
            clickHandler={() => {
              createOverlayPaths();
            }} 
          />
        }
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
    backgroundColor: 'black'
  },
  userCurrentLocation: {
    borderColor: '#e2e4e7',
    backgroundColor: 'white',
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    position: 'absolute',
    zIndex: 2,
    bottom: 40,
    right: 40
  },
  zoomLevelSlider: {
    width: 200,
    height: 60,
    position: 'absolute',
    zIndex: 2,
    bottom: 40,
    left: 100
  },
  disasterMarker: {
    width: 40,
    height: 40,
    borderRadius: 20
  }
});
