import { 
  useState, 
  useEffect, 
  useRef
} from "react";
import MapView, { PROVIDER_GOOGLE, Marker } from "react-native-maps";
import { 
  StyleSheet, 
  View, 
  Dimensions, 
  Platform, 
  Text, 
  AppState, 
  AppStateStatus, 
  ImageBackground 
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

import { GOOGLE_MAP_STYLE } from "../components/MapStyle"; 
import { AppMode, AssetPaths, Disaster, DisasterCard, Location, UserTasks, XmlAttributeMap } from "../commons/UserMap";
import { DisasterCardToast } from "../components/DisasterCardDetail";

// es6 import not supported for this xml parser
const XMLParser = require('react-xml-parser');
const parser = new XMLParser();

// Disaster Alert API
const DISASTER_ALERT_PUBLIC_URL = "https://hpxml.pdc.org/public.xml";

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

const Message = (props: { msg: string }) => {
  return (
    <View style={{
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center', //Centered vertically
      alignItems: 'center' // Centered horizontally
    }}>
      <Text style={{ 
        flex: 1, 
        flexDirection: 'row', 
        textAlign: 'center'
      }}>{props.msg}</Text>
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
  const [latDelta] = useState(LATITUDE_DELTA);
  const [lngDelta] = useState(LONGITUDE_DELTA);
  const [maxZoom, setMaxZoom] = useState(DEFAULT_ZOOM_LEVEL);
  const [disasterCards, setDisasterCards] = useState([] as DisasterCard[]);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [selectedDisasterCard, setSelectedDisasterCard] = useState({} as DisasterCard);

  // App states
  const appState = useRef(AppState.currentState);

  // User Location updates
  const DISTANCE_INTERVAL = 5;
  const [latLng, setLatLng] = useState({} as Location);
  const mapRef = useRef();

  const fetchDisasters = async () => {
    const fetchPromise = () => {
      return fetch(DISASTER_ALERT_PUBLIC_URL)
      .then((response) => response.text())
      .then((textResponse) => {
          const disasterCards: DisasterCard[] = [];
          const disasterResponsesArr = parser.parseFromString(textResponse);
          const children = disasterResponsesArr.children;
          for (let idx = 0; idx < children.length; idx++) {
            const disaster = Object.assign({}, children[idx]);
            const disasterCard = {
              uuid: disaster.getElementsByTagName(XmlAttributeMap.uuid)[0]['value'],
              latLng: {
                latitude: +disaster.getElementsByTagName(XmlAttributeMap.latitude)[0]['value'],
                longitude: +disaster.getElementsByTagName(XmlAttributeMap.longitude)[0]['value'],
              } as Location,
              severity: disaster.getElementsByTagName(XmlAttributeMap.severity)[0]['value'],
              disaster: disaster.getElementsByTagName(XmlAttributeMap.disaster)[0]['value'],
              hazardId: disaster.getElementsByTagName(XmlAttributeMap.hazardId)[0]['value'],
              hazardName: disaster.getElementsByTagName(XmlAttributeMap.hazardName)[0]['value'],
              lastUpdate: disaster.getElementsByTagName(XmlAttributeMap.lastUpdate)[0]['value'],
              description: disaster.getElementsByTagName(XmlAttributeMap.description)[0]['value'],
              assetUrl: AssetPaths[disaster.getElementsByTagName(XmlAttributeMap.disaster)[0]['value'] as Disaster ?? Disaster.FALLBACK],
            } as unknown as DisasterCard;

            if (!!disasterCard.latLng.latitude) {
              disasterCards.push(disasterCard);
            }
          }

          setDisasterCards(disasterCards);
      })
      .catch((error) => {
          console.log(error);
      });
    };
    
    await fetchPromise();
  }

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
          fetchDisasters();
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
    <View style={{ flex: 1 }}>
        <MapView
          ref={mapRef.current}
          minZoomLevel={MIN_ZOOM_LEVEL}   
          maxZoomLevel={maxZoom}
          style={styles.map} 
          provider={PROVIDER_GOOGLE} 
          region={{
            latitude: latLng.latitude,
            longitude: latLng.longitude,
            latitudeDelta: latDelta,
            longitudeDelta: lngDelta,
          }}
          showsUserLocation={true}
          followsUserLocation={true}
          showsMyLocationButton={true}
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
                onPress={() => setSelectedDisasterCard(disasterCard)}>
                <ImageBackground source={disasterCard.assetUrl} style={{ width: 25, height: 25 }}>
                    <Text style={{ width: 0, height: 0 }}>{Math.random()}</Text>
                </ImageBackground>
              </Marker>
            )
          }
        </MapView>
        {
          Object.keys(selectedDisasterCard).length > 0 && <DisasterCardToast toastData={selectedDisasterCard} />
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
            setMaxZoom(value);
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
