import { ImageURISource } from "react-native";
import { Overlay } from "react-native-maps";
export default function OverlayComponent(props: { lat: number, lng: number }) {
  const { lat, lng } = props;
  return (
    <>
        <Overlay image={{ uri: require('../../../assets/output_image.jpg') } as ImageURISource} bounds={[lat, lng] as any} />
    </>
  );
}