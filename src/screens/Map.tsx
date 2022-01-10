import { 
  useState, 
  useEffect, 
  useRef
} from "react";
import MapView, { PROVIDER_GOOGLE, Marker, MapTypes } from "react-native-maps";
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
import { 
  requestForegroundPermissionsAsync, 
  getCurrentPositionAsync, 
  watchPositionAsync, 
  LocationAccuracy, 
  LocationSubscription, 
  GeofencingEventType, 
  startGeofencingAsync, 
  LocationRegion,
  //requestBackgroundPermissionsAsync,
  PermissionStatus,
  //LocationPermissionResponse
} from "expo-location";
import * as TaskManager from 'expo-task-manager';
import Slider from "@react-native-community/slider";

import { GOOGLE_MAP_STYLE } from "../components/DisasterMap/MapStyle"; 
import { AppMode, DisasterCard, Location, UserTasks } from "../commons/UserMap";
import { DisasterCardDetail } from "../components/DisasterMap/DisasterCardDetail";
import { MapSearchBar } from "../components/DisasterMap/MapSearchBar";
import { CurrentLocationBtn, fetchDisasters, MapTypeBtn, Message, ViewIn3DBtn } from "../components/DisasterMap/MapUtils";

// User Tasks
//@ts-ignore
TaskManager.defineTask(UserTasks.LOCATION_GEO_FENCE, ({ data: { eventType, region }, error }) => {
  if (error) {
    // check `error.message` for more details.
    return;
  }
  if (eventType === GeofencingEventType.Enter) {
    console.log("You've entered region:", region);
  } else if (eventType === GeofencingEventType.Exit) {
    console.log("You've left region:", region);
  }
});

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
  const { width, height } = Dimensions.get('window');
  const ASPECT_RATIO = width / height;
  const LATITUDE_DELTA = 0.003;  
  const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
  const DEFAULT_ZOOM_LEVEL = 10;
  const MIN_ZOOM_LEVEL = 0;
  const MAX_ZOOM_LEVEL = 19;
  const mapTypes = ["standard" ,"satellite", "terrain"];
  const [latDelta] = useState(LATITUDE_DELTA);
  const [lngDelta] = useState(LONGITUDE_DELTA);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM_LEVEL);
  const [disasterCards, setDisasterCards] = useState([] as DisasterCard[]);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [selectedDisasterCard, setSelectedDisasterCard] = useState({} as DisasterCard);
  const [mapType, setMapType] = useState(mapTypes[0] as MapTypes);
  const [mapTypeIndex, setMapTypeIndex] = useState(1);


  // App states
  const appState = useRef(AppState.currentState);

  // User Location updates
  const DISTANCE_INTERVAL = 5;
  const [latLng, setLatLng] = useState({} as Location);
  const mapRef = useRef({} as MapView);

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

  const moveMapToCoordinate = (_latLng: Location) => {
    if (mapRef && mapRef.current) {
      //@ts-ignore
      mapRef.current.animateToRegion({
        latitude: _latLng.latitude,
        longitude: _latLng.longitude,
        latitudeDelta: latDelta + zoom,
        longitudeDelta: lngDelta + zoom
      });
    }
  };

  const toggleTo3D = async (_latLng: Location) => {
    console.log(_latLng)
    if (mapRef && mapRef.current) {
      //@ts-ignore
      const camera = await mapRef.current.getCamera();
      camera.heading = 40;
      camera.pitch = 10;
      camera.altitude = 1000;
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

    const beginUserTasks = async () => {
      startGeofencingAsync(UserTasks.LOCATION_GEO_FENCE, [{
        latitude: latLng.latitude,
        longitude: latLng.longitude,
        radius: 10
      } as LocationRegion] as LocationRegion[]);
    };

    const init = async () => {
      try {
        // Ask Permissions
        const fgLocationPermissionResponse = await requestForegroundPermissionsAsync();
        // const bgLocationPermissionResponse = await requestBackgroundPermissionsAsync();
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
          showsBuildings={true}
          showsTraffic={true}
          showsIndoors={true}
          showsIndoorLevelPicker={true}
          customMapStyle={GOOGLE_MAP_STYLE}
        >
          {
            disasterCards && disasterCards.length > 0 &&
            disasterCards.map((disasterCard, key) => 
              <Marker 
                key={key} 
                coordinate={{ latitude: disasterCard.latLng.latitude, longitude: disasterCard.latLng.longitude }}
                onPress={() => {
                  setSelectedDisasterCard(disasterCard);
                  moveMapToCoordinate(disasterCard.latLng);
                }}
              >
                <ImageBackground source={disasterCard.assetUrl} style={{ width: 25, height: 25 }}>
                    <Text style={{ width: 0, height: 0 }}>{Math.random()}</Text>
                </ImageBackground>
              </Marker>
            )
          }
        </MapView>
        {
          Object.keys(selectedDisasterCard).length > 0 && <DisasterCardDetail toastData={selectedDisasterCard} />
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
            moveMapToCoordinate({
              latitude: Object.keys(selectedDisasterCard).length > 0 ? selectedDisasterCard.latLng.latitude : latLng.latitude,
              longitude: Object.keys(selectedDisasterCard).length > 0 ? selectedDisasterCard.latLng.longitude : latLng.longitude,
              latitudeDelta: latDelta + zoom,
              longitudeDelta: lngDelta + zoom,
            } as Location)
          }}
        />
        <MapSearchBar data={disasterCards} navigateOnMap={(_latLng: Location) => moveMapToCoordinate(_latLng)} setSelectedDisasterCard={(d: DisasterCard) => setSelectedDisasterCard(d)} />
        <MapTypeBtn toggleHandler={() => toggleMapType()} />
        <ViewIn3DBtn toggleHandler={() => toggleTo3D(Object.keys(selectedDisasterCard).length > 0 ? selectedDisasterCard.latLng : latLng)} />
        <CurrentLocationBtn 
          moveToMyLocation={() => { 
            moveMapToCoordinate(latLng);
            setSelectedDisasterCard({} as DisasterCard);
          }} 
        />
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
