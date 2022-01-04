import { useState, useEffect, useRef } from "react";
import MapView, { PROVIDER_GOOGLE, Marker } from "react-native-maps";
import { StyleSheet, View, Dimensions, Platform, Text, AppState, AppStateStatus, ImageBackground } from "react-native";
import { requestForegroundPermissionsAsync, getCurrentPositionAsync, watchPositionAsync, LocationAccuracy, LocationSubscription } from "expo-location";
import Slider from "@react-native-community/slider";
import { GOOGLE_MAP_STYLE } from "./MapStyle"; 

// es6 import not supported for this xml parser
const XMLParser = require('react-xml-parser');
const parser = new XMLParser();

// Disaster Alert API
const DISASTER_ALERT_PUBLIC_URL = "https://hpxml.pdc.org/public.xml";
interface Location {
  latitude: number,
  longitude: number,
};

interface DisasterCard {
  uuid: string,
  latLng: Location,
  severity: Severity,
  disaster: Disaster,
  hazardId: string,
  hazardName: string,
  lastUpdate: string,
  description: string,
  assetUrl: any
};

const XmlAttributeMap = {
  uuid: 'uuid',
  latitude: 'latitude',
  longitude: 'longitude',
  severity: 'severity_ID',
  disaster: 'type_ID',
  hazardId: 'hazard_ID',
  hazardName: 'hazard_Name',
  lastUpdate: 'last_Update',
  description: 'description'
};

enum AppMode {
  ACTIVE="active",
  INACTIVE="inactive"
};

enum Disaster {
  FLOOD="FLOOD",
  WILDFIRE="WILDFIRE",
  WINTERSTORM="WINTERSTORM",
  TORNADO="TORNADO",
  VOLCANO="VOLCANO",
  EARTHQUAKE="EARTHQUAKE",
  STORM="STORM",
  EXTREMETEMPERATURE="EXTREMETEMPERATURE",
  BIOMEDICAL="BIOMEDICAL",
  AVALANCHE="AVALANCHE",
  DROUGHT="DROUGHT",
  LANDSLIDE="LANDSLIDE",
  FALLBACK="FALLBACK"
};

enum Severity {
  WARNING="WARNING",
  INFORMATION="INFORMATION",
  WATCH="WATCH",
  ADVISORY="ADVISORY"
};

const AssetPaths = {
  [Disaster.FLOOD]: require('../../assets/flood.png'),
  [Disaster.WILDFIRE]: require('../../assets/wildfire.png'),
  [Disaster.WINTERSTORM]: require('../../assets/winterstorm.png'),
  [Disaster.TORNADO]: require('../../assets/tornado.png'),
  [Disaster.VOLCANO]: require('../../assets/volcano.png'),
  [Disaster.EARTHQUAKE]: require('../../assets/earthquake.png'),
  [Disaster.STORM]: require('../../assets/storm.png'),
  [Disaster.EXTREMETEMPERATURE]: require('../../assets/extremetemperature.png'),
  [Disaster.BIOMEDICAL]: require('../../assets/biomedical.png'),
  [Disaster.AVALANCHE]: require('../../assets/avalanche.png'),
  [Disaster.DROUGHT]: require('../../assets/drought.png'),
  [Disaster.LANDSLIDE]: require('../../assets/landslide.png'),
  [Disaster.FALLBACK]: require('../../assets/burger.png')
};

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
  const [latDelta] = useState(LATITUDE_DELTA);
  const [lngDelta] = useState(LONGITUDE_DELTA);
  const [maxZoom, setMaxZoom] = useState(DEFAULT_ZOOM_LEVEL);
  const [disasterCards, setDisasterCards] = useState([] as DisasterCard[]);

  // App states
  const appState = useRef(AppState.currentState);

  // User Location updates
  const DISTANCE_INTERVAL = 5;
  const [latLng, setLatLng] = useState({} as Location);
  const mapRef = useRef();

  const fetchDisasters = () => {
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
    const initUserLocAysnc = async () => {
      const foregroundPermissions = await requestForegroundPermissionsAsync();
      if (foregroundPermissions.status == 'granted') {
        // Get user's current location
        const { coords } = await getCurrentPositionAsync({});
        setLocationAndAnimate({ longitude: +coords.longitude, latitude: +coords.latitude } as Location);
        // Foreground mode updates
        locationSubscription = await watchPositionAsync({ accuracy: LocationAccuracy.Highest, distanceInterval: DISTANCE_INTERVAL }, locationData => {
          isAppForeground(appState.current) && setLocationAndAnimate({ longitude: +locationData.coords.longitude, latitude: +locationData.coords.latitude } as Location);
        });
      }
    };
    
    fetchDisasters().then(() => initUserLocAysnc());

    return () => {
      AppState.removeEventListener('change', handleAppStateChange);
      locationSubscription && locationSubscription.remove();
    };
  }, []);

  if (!latLng.latitude) {
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
        }}>{'Loading map view...'}</Text>
      </View>
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
              <Marker key={key} coordinate={{ latitude: disasterCard.latLng.latitude, longitude: disasterCard.latLng.longitude }}>
                <ImageBackground source={disasterCard.assetUrl} style={{ width: 25, height: 25 }}>
                    <Text style={{ width: 0, height: 0 }}>{Math.random()}</Text>
                </ImageBackground>
              </Marker>
            )
          }
        </MapView>
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
