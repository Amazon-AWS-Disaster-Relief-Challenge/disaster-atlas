import { useState, useEffect, useRef } from "react";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import { StyleSheet, View, Dimensions, Platform, Text, AppState, AppStateStatus, TouchableOpacity } from "react-native";
import { requestForegroundPermissionsAsync, getCurrentPositionAsync, watchPositionAsync, LocationAccuracy, LocationSubscription } from "expo-location";
import Slider from "@react-native-community/slider";
import { GOOGLE_MAP_STYLE } from "./MapStyle"; 

//https://hpxml.pdc.org/public.xml
interface UserLoc {
  latitude: number,
  longitude: number,
};

enum AppMode {
  ACTIVE="active",
  INACTIVE="inactive"
}

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

  // App states
  const appState = useRef(AppState.currentState);

  // User Location updates
  const DISTANCE_INTERVAL = 5;
  const [latLng, setLatLng] = useState({} as UserLoc);
  const mapRef = useRef();

  const isAppForeground = (nextAppState: AppStateStatus) => {
    return appState.current.match(/inactive|background/) && nextAppState === AppMode.ACTIVE;
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    appState.current = nextAppState;
  };

  const setLocationAndAnimate = (location: UserLoc) => {
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
        setLocationAndAnimate({ longitude: +coords.longitude, latitude: +coords.latitude } as UserLoc);
        // Foreground mode updates
        locationSubscription = await watchPositionAsync({ accuracy: LocationAccuracy.Highest, distanceInterval: DISTANCE_INTERVAL }, locationData => {
          isAppForeground(appState.current) && setLocationAndAnimate({ longitude: +locationData.coords.longitude, latitude: +locationData.coords.latitude } as UserLoc);
        });
      }
    };

    initUserLocAysnc();

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
        />
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
  }
});
