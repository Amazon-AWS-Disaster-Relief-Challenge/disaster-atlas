import { Text, View, TouchableHighlight, Image, ImageBackground } from "react-native";
import { LatLng, MapEvent, Marker } from "react-native-maps";
import { MaterialIcons } from '@expo/vector-icons'; 
import { AssetPaths, Disaster, DisasterCard, Location, XmlAttributeMap } from "../../commons/UserMap";

export const Message = (props: { msg: string }) => {
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
  
export const CurrentLocationBtn = (props: { moveToMyLocation: () => void }) => {
    return (
        <TouchableHighlight onPress={() => props.moveToMyLocation()}>
            <View style={{
                position: 'absolute',
                bottom: 40,
                right: 10,
                width: 60,
                height: 60,
                borderRadius: 30,
                flex: 1,
                flexDirection: 'row',
                justifyContent: 'center',
                backgroundColor: '#FFFFFF'
            }}>
                <MaterialIcons name="my-location" size={24} color="black" style={{ alignSelf: 'center' }} />
            </View>
        </TouchableHighlight>
    );
};

export const ViewIn3DBtn = (props: { toggleHandler: () => void }) => {
    return (
        <TouchableHighlight onPress={() => props.toggleHandler()}>
            <View style={{
                position: 'absolute',
                bottom: 120,
                right: 10,
                width: 60,
                height: 60,
                borderRadius: 30,
                flex: 1,
                flexDirection: 'row',
                justifyContent: 'center',
                backgroundColor: '#FFFFFF'
            }}>
                <MaterialIcons name="3d-rotation" size={24} color="black" style={{ alignSelf: 'center' }} />
            </View>
        </TouchableHighlight>
    );
};

export const MapTypeBtn = (props: { toggleHandler: () => void }) => {
    return (
        <TouchableHighlight onPress={() => props.toggleHandler()}>
            <View style={{
                position: 'absolute',
                bottom: 200,
                right: 10,
                width: 60,
                height: 60,
                borderRadius: 30,
                flex: 1,
                flexDirection: 'row',
                justifyContent: 'center',
                backgroundColor: '#FFFFFF'
            }}>
                <MaterialIcons name="terrain" size={24} color="black" style={{ alignSelf: 'center' }} />
            </View>
        </TouchableHighlight>
    );
};

export const DirectionBtn = (props: { toggleHandler: () => void }) => {
    return (
        <TouchableHighlight onPress={() => props.toggleHandler()}>
            <View style={{
                position: 'absolute',
                bottom: 280,
                right: 10,
                width: 60,
                height: 60,
                borderRadius: 30,
                flex: 1,
                flexDirection: 'row',
                justifyContent: 'center',
                backgroundColor: '#FFFFFF'
            }}>
                <MaterialIcons name="directions" size={24} color="black" style={{ alignSelf: 'center' }} />
            </View>
        </TouchableHighlight>
    );
};

export const AddAssemblyPointMarker = (props: { clickHandler: () => void }) => {
    return (
        <TouchableHighlight onPress={() => props.clickHandler()}>
            <View style={{
                position: 'absolute',
                bottom: 80,
                left: 10,
                width: 60,
                height: 60,
                borderRadius: 30,
                flex: 1,
                flexDirection: 'row',
                justifyContent: 'center',
                backgroundColor: '#FFFFFF'
            }}>
                <Image source={AssetPaths.ASSEMBLE_DARK} style={{ alignSelf: 'center', width: 24, height: 24 }} />
            </View>
        </TouchableHighlight>
    );
};

export const AddWaypointMarker = (props: { clickHandler: () => void }) => {
    return (
        <TouchableHighlight onPress={() => props.clickHandler()}>
            <View style={{
                position: 'absolute',
                bottom: 160,
                left: 10,
                width: 60,
                height: 60,
                borderRadius: 30,
                flex: 1,
                flexDirection: 'row',
                justifyContent: 'center',
                backgroundColor: '#FFFFFF'
            }}>
                <Image source={AssetPaths.WAYPOINT} style={{ alignSelf: 'center', width: 24, height: 24 }} />
            </View>
        </TouchableHighlight>
    );
};

export const AssemblyPointMarker = (props: { uuid: string, location: Location, setDestination: (_latLng: Location) => void }) => {
    const assignDestination = (e: MapEvent<{}>) => {
        const latLng: LatLng = e.nativeEvent.coordinate;
        props.setDestination({
            latitude: latLng.latitude,
            longitude: latLng.longitude
        } as Location);
    };
    return (
        <Marker 
            key={props.uuid}
            draggable={true}
            coordinate={{ latitude: props.location.latitude, longitude: props.location.longitude }}
            onDragEnd={e => assignDestination(e)}
            onPress={e => assignDestination(e)}
        >
            <ImageBackground source={AssetPaths.ASSEMBLE} style={{ width: 25, height: 25 }}>
                <Text style={{ width: 0, height: 0 }}>{Math.random()}</Text>
            </ImageBackground>
        </Marker>
    );
};

// Map API related...
// es6 import not supported for this xml parser
const XMLParser = require('react-xml-parser');
const parser = new XMLParser();

// Disaster Alert API
const DISASTER_ALERT_PUBLIC_URL = "https://hpxml.pdc.org/public.xml";

export const fetchDisasters = async () => {
    const fetchPromise = (): Promise<DisasterCard[]> => {
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

          return disasterCards;
      })
      .catch((error) => {
          console.log(error);
          return [] as DisasterCard[];
      });
    };
    
    const disasterList: DisasterCard[] = await fetchPromise();
    return disasterList;
}