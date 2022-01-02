import { useState, useEffect } from "react";
import MapView, { PROVIDER_GOOGLE, Marker } from "react-native-maps";
import { StyleSheet, View, Dimensions, Platform, Text } from "react-native";
import { requestForegroundPermissionsAsync, getCurrentPositionAsync, startLocationUpdatesAsync, watchPositionAsync, LocationAccuracy, LocationSubscription } from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Gyroscope } from 'expo-sensors';

//https://hpxml.pdc.org/public.xml
interface UserLoc {
  latitude: number,
  longitude: number,
};

enum Tasks {
  USER_LOCATION="user-location"
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
  const DELTA = 0.15;
  const [delta] = useState(DELTA);

  // User Location updates
  const LOCATION_UPDATES_INTERVAL = 5000;
  const DISTANCE_INTERVAL = 5;
  const [location, setLocation] = useState({} as UserLoc);

  useEffect(() => {
    let locationSubscription: LocationSubscription;
    const initUserLocAysnc = async () => {
      const foregroundPermissions = await requestForegroundPermissionsAsync();
      if (foregroundPermissions.status !== 'granted') {
        return;
      } else {
  
        const initUserLocationBackgroundTask = () => {
          TaskManager.defineTask(Tasks.USER_LOCATION, ({ data, error }) => {
            if (error) {
              // check `error.message` for more details.
              console.log('error -->', error.message);
              return;
            }
            const location = (data as any).locations.length > 0 ? (data as any).locations[0] : undefined;

            console.log(location);
            if (location) {
              setLocation(location);
            }
           });
        };
    
        // initialize task manager for location update background task.
        initUserLocationBackgroundTask();
  
        // Get user's current location
        const { coords } = await getCurrentPositionAsync({});
        setLocation({ longitude: +coords.longitude, latitude: +coords.latitude });
        // Foreground mode updates
        locationSubscription = await watchPositionAsync({ accuracy: LocationAccuracy.Highest, distanceInterval: DISTANCE_INTERVAL }, locationData => {
          setLocation({ longitude: +locationData.coords.longitude, latitude: +locationData.coords.latitude });
        });
        // Background mode updates
        startLocationUpdatesAsync(Tasks.USER_LOCATION, { 
          deferredUpdatesInterval: LOCATION_UPDATES_INTERVAL, 
          showsBackgroundLocationIndicator: true,
          distanceInterval: DISTANCE_INTERVAL,
        });
      }
    };

    initUserLocAysnc();

    return () => {
      locationSubscription.remove();
    };
  }, []);
console.log(`-----> ${JSON.stringify(location)}`);
  if (!location.latitude) {
    return (<Text>{'Loading map view...'}</Text>);
  }

  return (
    <MapView 
      style={styles.map} 
      provider={PROVIDER_GOOGLE} 
      initialRegion={{
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: delta,
        longitudeDelta: delta,
      }}
    >
      <UserMarker location={location}/>
    </MapView>
  );
};

const UserMarker = (props: { location: { latitude: number, longitude: number }}) => {
  // User phone gyroscope updates
  const OUTER_LEN = 30;
  const INNER_LEN = 20;
  const [outerLength] = useState(OUTER_LEN);
  const [innerLength] = useState(INNER_LEN);

  useEffect(() => {
    Gyroscope.addListener(gyroscopeData => {
      const {x, y, z} = gyroscopeData;
      console.log(`x: ${Math.round(x)}, y: ${Math.round(y)}, z: ${Math.round(z)}`);
    });
    return () => {
      Gyroscope.removeAllListeners();
    };
  });

  if (!props.location.latitude && !props.location.longitude) {
    return (<Text style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignSelf: 'center' }}>{'Loading map view...'}</Text>);
  }

  return (
    <Marker coordinate={{ latitude: props.location.latitude, longitude: props.location.longitude }} >
      <View style={{ 
        width: outerLength,
        height: outerLength,
        borderRadius: outerLength / 2,
        ...styles.userMarkerOuter 
      }}>
        <View style={{
          width: innerLength,
          height: innerLength,
          borderRadius: innerLength / 2,
          ...styles.userMarkerInner 
        }}>
        </View>
      </View>
    </Marker>
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
  userMarkerOuter: {
    borderColor: '#e2e4e7',
    backgroundColor: 'white',
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center'
  },
  userMarkerInner: {
    backgroundColor: '#0083ff',
    alignSelf: 'center'
  },
});
