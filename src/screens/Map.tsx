import { useState, useEffect, useRef } from "react";
import MapView, { PROVIDER_GOOGLE, AnimatedRegion } from "react-native-maps";
import { StyleSheet, View, Dimensions, Platform, Text, AppState, AppStateStatus, TouchableHighlight } from "react-native";
import { requestForegroundPermissionsAsync, getCurrentPositionAsync, watchPositionAsync, LocationAccuracy, LocationSubscription } from "expo-location";
import { Ionicons } from "@expo/vector-icons";

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
  const [latDelta] = useState(LATITUDE_DELTA);
  const [lngDelta] = useState(LONGITUDE_DELTA);
  const ANIMATION_DELAY = 7000;

  // App states
  const appState = useRef(AppState.currentState);

  // User Location updates
  const DISTANCE_INTERVAL = 5;
  const [latLng, setLatLng] = useState({} as UserLoc);
  const [coordinate, setCoordinate] = useState({} as AnimatedRegion);
  const mapRef = useRef();
  const markerRef = useRef();

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
    setCoordinate(new AnimatedRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA
      })
    );
    
    if (Platform.OS == 'android') {
      if (markerRef && markerRef.current) {
        //@ts-ignore
        markerRef.current.animateMarkerToCoordinate(coordinate, ANIMATION_DELAY);
      }
    }
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
    return (<Text style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignSelf: 'center' }}>{'Loading map view...'}</Text>);
  }

  return (
    <View style={{ flex: 1 }}>
        <MapView 
          ref={mapRef.current}
          minZoomLevel={4}   
          maxZoomLevel={16}
          style={styles.map} 
          provider={PROVIDER_GOOGLE} 
          initialRegion={{
            latitude: latLng.latitude,
            longitude: latLng.longitude,
            latitudeDelta: latDelta,
            longitudeDelta: lngDelta,
          }}
          showsUserLocation={true}
          followsUserLocation={true}
        />
        <TouchableHighlight 
          style={styles.userCurrentLocation} 
          onPress={() => {
            if (mapRef && mapRef.current) {
              //@ts-ignore
              mapRef.current.animateToRegion({
                latitude: latLng.latitude,
                longitude: latLng.longitude,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA
              });
            }
          }}>
          <View style={{  alignSelf: 'center' }}>
            <Ionicons name="navigate" size={32} color="grey" />
          </View>
        </TouchableHighlight>
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
  }
});
