import { useEffect, useRef } from "react";
import { 
    StyleSheet,
    Dimensions,
    ScrollView,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { Ionicons } from '@expo/vector-icons';
import { DisasterCard } from "../commons/UserMap";
import { Severity } from "../commons/UserMap";

export const DisasterCardDetail = (props: { toastData: DisasterCard }) => {
    const closeBtnRef = useRef({} as any);
    const textRefs = useRef([] as any[]);
    const lastUpdatedTime = new Date(props.toastData.lastUpdate);
    const severity = props.toastData.severity;
    let color = '#FFFFFF';
    
    if (severity == Severity.ADVISORY) {
        color = '#f3da0b';
    } else if (severity == Severity.WARNING) {
        color = '#f70505';
    }

    const animation = 'slideInUp';
    const animationBtn = 'fadeInDown';
    const durations = [200, 400, 600, 800, 1000];
    const easing = 'ease-in-out';

    useEffect(() => {
        textRefs.current.forEach(c => {
            c.slideInUp();
        });
        closeBtnRef.current.fadeInDown();
    }, [props.toastData]);

    return (
        <ScrollView style={styles.container}>
            <Animatable.View ref={el => (closeBtnRef.current = el)} style={styles.closeBtn} animation={animationBtn} duration={durations[durations.length - 1]} easing={easing}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
            </Animatable.View>
            <Animatable.Text ref={el => (textRefs.current[0] = el)} animation={animation} duration={durations[0]} easing={easing} style={styles.title}>{props.toastData.disaster}</Animatable.Text>
            <Animatable.Text ref={el => (textRefs.current[1] = el)} animation={animation} duration={durations[1]} easing={easing} style={{...styles.severity, color: color}}>{`[${props.toastData.severity}]`}</Animatable.Text>
            <Animatable.Text ref={el => (textRefs.current[2] = el)} animation={animation} duration={durations[2]} easing={easing} style={styles.hazardName}>{`${props.toastData.hazardName}`}</Animatable.Text>
            <Animatable.Text ref={el => (textRefs.current[3] = el)} animation={animation} duration={durations[3]} easing={easing} style={styles.descriptionAndTime}>{`Last updated: ${lastUpdatedTime}`}</Animatable.Text>
            <Animatable.Text ref={el => (textRefs.current[4] = el)} animation={animation} duration={durations[4]} easing={easing} style={styles.descriptionAndTime1}>{props.toastData.description}</Animatable.Text>
        </ScrollView>
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
        color: '#FFFFFF',
        backgroundColor: '#222222',
        borderColor: '#e2e4e7',
        borderWidth: 1,
        zIndex: 2,
        position: 'absolute',
        bottom: 100,
        borderRadius: 20
    },
    title: {
        fontSize: 24,
        color: '#977537',
        textAlign: 'center',
        padding: 10
    },
    severity: {
        fontSize: 18,
        textAlign: 'center',
        paddingBottom: 5
    },
    hazardName: {
        fontSize: 16,
        color: '#FFFFFF',
        textAlign: 'center',
        padding: 8
    },
    descriptionAndTime: {
        fontSize: 12,
        color: '#FFFFFF',
        textAlign: 'left',
        padding: 5,
        lineHeight: 18,
        fontWeight: 'bold'
    },
    descriptionAndTime1: {
        fontSize: 12,
        color: '#FFFFFF',
        textAlign: 'left',
        padding: 5,
        lineHeight: 20,
        fontStyle: 'italic'
    },
    closeBtn: {
        position: 'absolute',
        right: 0,
        top: 0
    }
});