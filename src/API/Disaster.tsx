// Map API related...

import { AssetPaths, Disaster, DisasterCard, Location, XmlAttributeMap } from "../commons/UserMap";

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

          // Add mock disaster
          disasterCards.push(mockDisasterCard);

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

const mockDisasterCard = {
    uuid: 'a62bbd21-6334-487d-9987-25975e174cd5',
    latLng: {
      latitude: 47.601214,
      longitude: -122.134499
    } as Location,
    severity: "WARNING",
    disaster: "FLOOD",
    hazardId: "166688",
    hazardName: "Floods -  Richardson, Texas, USA",
    lastUpdate: "2022-01-03T06:01:00-10:00",
    description: "Floods have been reported in parts of Richardson, Texas, USA. Reports indicate that at least 11,637 people have been affected and at least 3,425 houses have been damaged.",
    assetUrl: AssetPaths[Disaster.FLOOD],
} as unknown as DisasterCard;

export const fetchSafeWaypoints = async () => {
    const fetchPromise = (): Promise<Location[]> => {
        return new Promise(resolve => {
            const safeWaypointList = [{
                latitude: 47.601214,
                longitude: -122.120,
            }] as Location[];
            resolve(safeWaypointList);
        });
    };
    
    const safeWaypointsList: Location[] = await fetchPromise();
    return safeWaypointsList;
}

const paths = require('./paths1.json');

// const fromPointToLatLng = (x: number, y: number, lat: number, lng: number) => {
//   const tileSize = 500;
//   const size = {
//     x: tileSize,
//     y: tileSize
//   };
//   const zoom = 16;
//   const degreesPerPixelX = 360 / Math.pow(2, zoom + 8);
//   const degreesPerPixelY = 360 / Math.pow(2, zoom + 8) * Math.cos(lat * Math.PI / 180);
//   const newLat = lat - degreesPerPixelY * (y - size.y / 2);
//   const newLng = lng + degreesPerPixelX * (x - size.x / 2);

//   return [newLng, newLat];
// };

// https://help.openstreetmap.org/questions/75611/transform-xy-pixel-values-into-lat-and-long
// https://en.wikipedia.org/wiki/Web_Mercator_projection

const tileSize = 400;
const degrees_to_radians = (deg: number) => (deg * Math.PI) / 180.0;
const radians_to_degrees = (rad: number) => (rad * 180.0) / Math.PI;

const latLontoXY = (lat_center: number, lon_center: number, zoom: number) => {
    const C = (tileSize / (2 * Math.PI)) * 2**zoom;
    const x = C * (degrees_to_radians(lon_center) + Math.PI);
    const y = C * (Math.PI - Math.log(Math.tan((Math.PI/4) + degrees_to_radians(lat_center) / 2)));
    return [x , y];
}

const xy2LatLon = (pxX_internal: number, pxY_internal: number, lat_center: number, lon_center: number, zoom: number = 16) => {
  const width_internal = tileSize;
  const height_internal = tileSize;

  const [xcenter , ycenter] = latLontoXY(lat_center, lon_center, zoom);
  const xPoint = xcenter - (width_internal / 2 - pxX_internal);
  const ypoint = ycenter - (height_internal /2 - pxY_internal);
  const C = (tileSize / (2 * Math.PI)) * 2**zoom;
    
  const M = (xPoint / C) - Math.PI;
  const N = -(ypoint / C) + Math.PI;

  const lon_Point = radians_to_degrees(M)
  const lat_Point = radians_to_degrees((Math.atan(Math.E**N)-(Math.PI/4))*2);

  return [lon_Point, lat_Point];
}

export const fetchOverlayPaths = async (lat: number, lng: number) => {
  const fetchPromise = (): Promise<any[]> => {
      return new Promise(resolve => {
          paths.map((path: any) => {
            path[0] = xy2LatLon(Math.round(path[0][1] * 1000000) / 1000000, Math.round(path[0][0] * 1000000) / 1000000, lat, lng);
            path[1] = xy2LatLon(Math.round(path[1][1] * 1000000) / 1000000, Math.round(path[1][0] * 1000000) / 1000000, lat, lng);
            path.splice(-1);
            return path;
          });
          resolve(paths);
      });
  };
  
  const overlayPathsList = await fetchPromise();
  return overlayPathsList;
}

// fetchOverlayPaths().then(data => {}).catch(error => console.log(error))