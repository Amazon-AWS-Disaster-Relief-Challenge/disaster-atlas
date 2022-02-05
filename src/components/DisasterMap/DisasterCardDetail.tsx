import { useEffect, useRef, useState } from "react";
import { 
    StyleSheet,
    Dimensions,
    ScrollView,
    TouchableWithoutFeedback,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { Ionicons } from '@expo/vector-icons';
import { DisasterCard } from "../../commons/UserMap";
import { Severity } from "../../commons/UserMap";

export const DisasterCardDetail = (props: { toastData: DisasterCard }) => {
    const closeBtnRef = useRef({} as any);
    const textRefs = useRef([] as any[]);
    const [hide, setHide] = useState(false);
    const lastUpdatedTime = new Date(props.toastData.lastUpdate);
    const severity = props.toastData.severity;
    let color = '#222222';
    
    if (severity == Severity.ADVISORY) {
        color = '#f3da0b';
    } else if (severity == Severity.WARNING) {
        color = '#FF9900';
    }

    const animation = 'slideInUp';
    const animationBtn = 'fadeInDown';
    const durations = [200, 400, 600, 800, 1000, 1200];
    const easing = 'ease-in-out';

    useEffect(() => {
        if (hide == true) {
            setHide(false);
        }
        textRefs.current.forEach(c => {
            c && c.slideInUp();
        });
        closeBtnRef.current && closeBtnRef.current.fadeInDown();
    }, [props.toastData]);

    console.log(`Geolocation: ${props.toastData.latLng.latitude}, ${props.toastData.latLng.longitude}`);

    return (
        <>
            {
                hide == false && 
                <ScrollView style={styles.container}>
                    <TouchableWithoutFeedback onPress={() => setHide(true)} >
                        <Animatable.View style={styles.closeBtn} ref={el => (closeBtnRef.current = el)} animation={animationBtn} duration={durations[durations.length - 1]} easing={easing}>
                            <Ionicons name="close" size={24} color="#222222" />
                        </Animatable.View>
                    </TouchableWithoutFeedback>
                    <Animatable.Text ref={el => (textRefs.current[0] = el)} animation={animation} duration={durations[0]} easing={easing} style={{...styles.severity, color: color}}>{`${props.toastData.severity}`}</Animatable.Text>
                    <Animatable.Text ref={el => (textRefs.current[1] = el)} animation={animation} duration={durations[1]} easing={easing} style={styles.title}>{props.toastData.disaster}</Animatable.Text>
                    <Animatable.Text ref={el => (textRefs.current[2] = el)} animation={animation} duration={durations[2]} easing={easing} style={styles.hazardName}>{`${props.toastData.hazardName}`}</Animatable.Text>
                    <Animatable.Text ref={el => (textRefs.current[3] = el)} animation={animation} duration={durations[3]} easing={easing} style={styles.geoLocation}>{`Geolocation: ${props.toastData.latLng.latitude}, ${props.toastData.latLng.longitude}`}</Animatable.Text>
                    <Animatable.Text ref={el => (textRefs.current[4] = el)} animation={animation} duration={durations[4]} easing={easing} style={styles.descriptionAndTime}>{`Last updated: ${lastUpdatedTime}`}</Animatable.Text>
                    <Animatable.Text ref={el => (textRefs.current[5] = el)} animation={animation} duration={durations[5]} easing={easing} style={styles.descriptionAndTime1}>{props.toastData.description}</Animatable.Text>
                </ScrollView>
            }
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        width: Dimensions.get("window").width - 40,
        height: 200,
        flex: 1,
        flexDirection: 'column',
        alignSelf: 'center',
        margin: 20,
        padding: 20,
        color: '#222222',
        backgroundColor: '#FFFFFF',
        borderColor: '#E7E7E7',
        borderWidth: 1,
        zIndex: 2,
        position: 'absolute',
        bottom: 100,
        borderRadius: 20,
    },
    title: {
        fontSize: 24,
        color: '#222222',
        textAlign: 'left',
        fontWeight: 'bold',
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 20,
    },
    severity: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'left',
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    hazardName: {
        fontSize: 14,
        color: '#222222',
        textAlign: 'left',
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 20,
    },
    geoLocation: {
        fontSize: 14,
        color: '#222222',
        textAlign: 'left',
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 20,
    },
    descriptionAndTime: {
        fontSize: 14,
        color: '#222222',
        textAlign: 'left',
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 20,
    },
    descriptionAndTime1: {
        fontSize: 14,
        color: '#222222',
        textAlign: 'left',
        fontStyle: 'italic',
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 50,
    },
    closeBtn: {
        position: 'absolute',
        right: 0,
        top: 0,
        zIndex: 4
    }
});